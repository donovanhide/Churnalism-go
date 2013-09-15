var SearchView = Marionette.ItemView.extend({
	template: '#searchTemplate',
	events:{
		'click #search'	: 'search',
		'click #save'	: 'save'
	},
	modelEvents:{
		'change' : 'validate'
	},
	ui:{
		'buttons': '#search,#save'
	},
	// Stickit configuration
	bindings: {
    	'#text': 'text',
    	'#title': 'title',
    	'#source': 'source',
    	'#published': 'published',
    	'#textEntered': {
    	   	observe:'text',
    	   	updateMethod: 'html',
    	 	onGet: function(val) { return _.prune(val,800).replace(/\n/g, '<br />'); }
    	},
    	'#noResults':{
			observe: 'totalRows',
    		visible: function(val){return val===0}
    	},
    	'#searchForm':{
    		observe: 'documents',
    		visible: function(){return !this.model.hasResults()}
    	},
    	'#saveForm':{
    		observe: 'documents',
    		visible: function(){return this.model.hasResults()}
    	},
  	},
	onDomRefresh: function(){
    	Backbone.Validation.bind(this);
    	this.stickit();
    	this.validate();
    	this.$el.tooltip({selector:':input',trigger:'focus',animation:false});
  	},
  	validate: function(){
  		el=this.$el;
  		el.find('*').removeClass('has-error');
  		_.each(this.model.validate(),function(k,v){
  			el.find('#'+v).parent().addClass('has-error');
  		});
  		this.ui.buttons.prop('disabled',!this.model.isValid());
  	},
  	search: function(e){
  		e.preventDefault();
  		if(this.model.isValid(true)){
  			this.model.execute();
  		}
  	},
  	save: function(e){
  		e.preventDefault();
  		if(this.model.isValid(true)){
  			this.model.save(['title','text','published','source']);
  		}
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
				return _.has(this,"metaData")?_.first(this.metaData.permalink):""
			},
			journalisted: function(){
				return _.has(this,"metaData")?"http://journalisted.com/article/"+Number(_.first(this.metaData.id)).toString(36):""
			},
	    	journalists: function(){
	      		return _.has(this,"metaData")?_.join(",",this.metaData.journalists):""
	    	},
	    	source: function(){
	    		return _.has(this,"metaData")?_.first(this.metaData.source):""
	    	},
	    	published: function(){
	    		return _.has(this,"metaData")?moment(_.first(this.metaData.published)).format('Do MMMM YYYY'):""
	    	},
	    	score: function(){
	    		return Number((this.leftCharacters/search.get('text').length+this.rightCharacters/this.characters)*1.5).toFixed(0)
	    	},
	    	cut: function(){
	    		return Number(this.leftCharacters/search.get('text').length*100).toFixed(0)
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
  		this.buildMiniChurn(vis,this.model.get('leftFragments'),this.options.search.get('text').length);
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

var ResultsView = Marionette.CompositeView.extend({
	template: '#resultsTemplate',
	itemView: ResultView,
	itemViewOptions:function(){
		return {
			search: this.model
		}
	},
	itemViewContainer: "tbody",
	initialize: function(options){
		this.collection=this.model.get('documents');
	}
})

var App = new Marionette.Application();

App.addInitializer(function(options){
	App.addRegions({
		left: '#left',
		right: '#right',
		bottom: '#bottom'
	});
	App.Search=new Search({
		title:"",
		text:"",
		source:"",
		published: moment().format('YYYY-MM-DD')
	});
    App.Search.on("executed",function(){
    	router.navigate("save/",{trigger:true});
    })
});

App.on("initialize:after", function(){
  if (Backbone.history){ Backbone.history.start({pushState:true}); }
});

var AppRouter=Marionette.AppRouter.extend({
  	appRoutes: {
        ""				: "search",
        "save/"			: "save",
        ":doc/"			: "results",
        ":left/:right/"	: "sidebyside"
    }
});

var controller={
    search: function(){
		App.left.show(new SearchView({ model:App.Search}));
		App.right.show(new SideBarView());
    },
    save: function(){
    	App.left.show(new SearchView({ model:App.Search}));
		App.right.show(new SideBarView());
    	App.bottom.show(new ResultsView({model: App.Search}));
    },
    results: function(){

    },
    sidebyside: function(){

    }
}

var router = new AppRouter({controller:controller});

$(function(){
	App.start();
});