var SlurpSearch = Search.extend({
    initialize: function(){
        _.extend(this.validation,{
            url:{
                pattern: 'url',
                required: false,
            }    
        })
    },
    slurp: function(){
        model=this;
        $.get('/slurp/',{url: this.get("url")}).done(function(data){
            model.set({
                "text"                : _(data.content).stripTags().trim().unescapeHTML().value(),
                "title"               : data.title,
                "metaData.source"     : data.url,
                "metaData.published"  : moment(data.data_published).format('YYYY-MM-DD'),
            })
            model.trigger('slurped');
            console.log(data);
        });     
    }
})

var SearchView = Marionette.ItemView.extend({
	template: '#searchTemplate',
	events:{
		'click #search'	: 'search',
		'click #save'	: 'save',
        'click #slurp'  : 'slurp',
		'keyup'	        : 'showErrors'
	},
	ui:{
		'buttons': '#search,#save'
	},
	// Stickit configuration
	bindings: {
    	'#text': 'text',
    	'#title': 'title',
    	'#source': 'metaData.source',
    	'#published': 'metaData.published',
    	'#textEntered': {
    	   	observe:'text',
    	   	updateMethod: 'html',
    	 	onGet: function(val) { return _.lines(_.prune(val,800)).map(function(l){return "<p>"+l+"</p>"}); }
    	},
    	'#noResults':{
			observe: 'totalRows',
    		visible: function(val){return val===0}
    	},
        '#search':{
            observe: 'text',
            update: function($el, val, model, options){
                valid=_.isEmpty(model.preValidate('text',model.get('text')));
                $el.attr("disabled",!valid);
            }
        },
        '#url': 'url',
        '#slurp':{
            observe: 'url',
            update: function($el, val, model, options){
                valid=(!_.isEmpty(model.get("url")))&&(_.isEmpty(model.preValidate('url',model.get('url'))))
                $el.attr("disabled",!valid);
            }
        }
  	},
  	getTemplate: function(){
  		switch(this.model.get('mode')){
  		case "search":
  			return '#searchTemplate';
  		case "save":
  			return '#saveTemplate';
  		case "saved":
  			return '#savedTemplate';
  		case "sidebyside":
  			return '#sidebysideTemplate'
  		}
  	},
	onDomRefresh: function(){
    	Backbone.Validation.bind(this);
    	this.stickit();
    	this.showErrors();
    	this.$el.tooltip({selector:':input',trigger:'focus',animation:false});
  	},
  	showErrors: function(){
  		el=this.$el;
  		el.find('*').removeClass('has-error');
  		_.each(this.model.validate(),function(k,v){
  			el.find('#'+_.ltrim(v,"metaData.")).parent().addClass('has-error');
  		});
  	},
  	search: function(e){
  		e.preventDefault();
  		if(this.model.isValid(true)){
  			this.trigger("search")
  		}
  	},
  	save: function(e){
  		e.preventDefault();
  		if(this.model.isValid(true)){
  			this.trigger("save")
  		}
  	},
    slurp: function(e){
        e.preventDefault();
        this.trigger("slurp");  
    }
})

var SideBarView = Marionette.ItemView.extend({
	template: '#sidebarTemplate',
});

var ResultView = Marionette.ItemView.extend({
	tagName: 'tr',
	template: '#resultTemplate',
	ui:{
		visualisation: '#visualisation'
	},
	templateHelpers:function(){
		search=this.options.search;
		return {
			shortTitle: function(){
				return _.prune(this.title,80)
			},
			permalink: function(){
				return _.first(this.metaData.permalink)
			},
			journalisted: function(){
				return "http://journalisted.com/article/"+Number(_.first(this.metaData.id)).toString(36)
			},
	    	journalists: function(){
	      		return _.join(",",this.metaData.journalists)
	    	},
	    	source: function(){
	    		return _.first(this.metaData.source)
	    	},
	    	published: function(){
	    		return moment(_.first(this.metaData.published)).format('Do MMMM YYYY')
	    	},
	    	score: function(){
	    		return Number((this.leftCharacters/this.parent.get('text').length+this.rightCharacters/this.characters)*1.5).toFixed(0)
	    	},
	    	cut: function(){
	    		return Number(this.leftCharacters/this.parent.get('text').length*100).toFixed(0)
	    	},
	    	paste: function(){
	    		return Number(this.rightCharacters/this.characters*100).toFixed(0)
	    	},
	    	overlap: function(){
	    		return this.leftCharacters
	    	}
    	}
  	},
  	onRender: function(){
  		vis=Raphael(this.ui.visualisation.get(0),180,60);
  		this.buildMiniChurn(vis,this.model.get('leftFragments'),this.model.get('parent').get('text').length);
  		this.buildMiniChurn(vis,this.model.get('rightFragments'),this.model.get('characters')).transform("t100,0");
  	},
  	buildMiniChurn: function(vis,fragments,length){
  		vis.setStart();
  		_.each([80,80,80,80,80,60],function(val,i){
  			vis.rect(0,i*7,val,5).attr({fill:'black',stroke:'none'})
  		})
  		_.each(fragments,function(val){
  			start=Math.floor(val[0]/length*460);
  			end=Math.ceil((val[0]+val[1])/length*460);
  			row=Math.floor(start/80);
  			while (start<end){
  				rowStart=start%80;
  				rowLength=Math.min(80-rowStart,end-start);
  				vis.rect(rowStart,row*7,rowLength,5).attr({fill:'orange',stroke:'none'});
  				start+=rowLength;
  				row++;
  			}
  		})
  		return vis.setFinish();
  	}
})

var ResultsGroupView = Marionette.CompositeView.extend({
	template: '#resultsGroupTemplate',
	itemView: ResultView,
	itemViewContainer: "tbody",
	initialize: function(options){
		this.collection=this.model.get("associations");
	},
	templateHelpers:{
		title: function(){
			count=this["associations"].length;
			return count+" "+_.humanize(this["name"])+((count>1)?"s":"");
		}
	}
})

var ResultsView = Marionette.CompositeView.extend({
	template: '#resultsTemplate',
	itemView: ResultsGroupView,
	itemViewContainer: "section",
	initialize: function(options){
	   this.collection=this.model.groupedAssociations("type");
	}
})

var App = new Marionette.Application();

App.addInitializer(function(options){
	App.addRegions({
		left: '#left',
		right: '#right',
		bottom: '#bottom'
	});
});

App.on("initialize:after", function(){
  if (Backbone.history){ Backbone.history.start({pushState:true}); }
});

var AppRouter=Marionette.AppRouter.extend({
  	appRoutes: {
        ""						: "search",
        "save(/)"				: "save",
        ":doctype/:docid(/)"	: "results",
        ":left#:right(/)"		: "sidebyside"
    }
});

var Controller=Marionette.Controller.extend({
    initialize: function(){
		App.Search=new SlurpSearch(doc,{parse:true});
		App.Search.on({
			"executed":function(){
				router.navigate("save/",{trigger:true});
			},
			"saved":function(){
				App.Search.associate();
			},
			"associated":function(){
				router.navigate(this.id,{trigger:true});
			},
            "slurped": function(){
                App.Search.execute();
            }
		});
    	App.SearchView=new SearchView({ model:App.Search});
    	App.SearchView.on({
    		"search":function(){
    			App.Search.execute();
    		},
    		"save": function(){
    			App.Search.save();
    		},
            "slurp": function(){
                App.Search.slurp();
            }
    	});
    },
    search: function(){
    	App.Search.unset("associations");
    	App.Search.set("metaData",{
			type: "search",
			published: moment().format('YYYY-MM-DD'),
			source: ""
		});
    	App.Search.set({mode:"search"});
		App.left.show(App.SearchView);
		App.right.show(new SideBarView());
		App.bottom.close();
    },
    save: function(){
    	App.Search.unset("id");
        App.Search.set({mode:"save"});
    	App.left.show(App.SearchView);
		App.right.show(new SideBarView());
    	App.bottom.show(new ResultsView({model: App.Search}));
    },
    results: function(){
    	App.Search.set({mode:"saved"});
    	App.left.show(App.SearchView);
		App.right.show(new SideBarView());
    	App.bottom.show(new ResultsView({model: App.Search}));
    },
    sidebyside: function(){
    	console.log("sidebyside");
    }
});

var router = new AppRouter({controller:new Controller()});

$(function(){
	App.start();
});