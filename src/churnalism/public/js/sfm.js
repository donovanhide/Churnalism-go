_.mixin(_.str.exports());

var Document = Backbone.DeepModel.extend({
	url: function(){
		return "/document/"+(this.isNew()?"":this.id);
	},
	defaults:{
		title:"",
		text:"",
		metaData:{}
	},
	groupedAssociations: function(field){
		grouped=this.get('associations').groupBy(function(doc){
			return _.first(doc.get('metaData')[field]);
		});
		return new Backbone.Collection(_.map(grouped,function(docs,group){
			return {
				name: group,
				associations: new DocumentList(docs)
			}
		}));
	},
	parse: function(response){
		if (_.has(response,"id")){
			response["id"]=response.id.doctype+"/"+response.id.docid+"/";
		}
		if (_.has(response,"associations")){
			associations=_.map(response["associations"],function(a){
				return _.extend(a,{parent:this});
			},this);
			response["associations"]=new DocumentList(associations,{parse:true});
		}
    	if (_.has(response,'fragments')){
	    	left=this._mergeFragments(response.fragments,0);
	    	right=this._mergeFragments(response.fragments,1);
	    	_.extend(response,{
	    		leftFragments: left,
	    		rightFragments: right,
	    		leftCharacters: _.reduce(left,function(sum,val){return sum+val[1]},0),
	    		rightCharacters: _.reduce(right,function(sum,val){return sum+val[1]},0)
	    	});
    	}
    	return response;
    },
    _mergeFragments: function(fragments,pos){
    	sorted=_.sortBy(fragments,function(val){return val[pos]})
    	merged=[[sorted[0][pos],sorted[0][2]]];
    	_.each(sorted.slice(1),function(value){
    		if ((_.last(merged)[0]+_.last(merged)[1])>=(value[pos]+value[2])){
    			_.last(merged)[1]=value[pos]+value[2]-_.last(merged)[0]
    		}else{
    			merged.push([value[pos],value[2]])
    		}
    	})
    	return merged;
    },
	save: function(){
		fields=_.extend(this.get("metaData"),this.pick(["title","text"]));
		model=this;
		$.post(this.url(),fields).done(function(data){
			model.set("id",data.target.doctype+"/"+data.target.docid+"/");
			model.trigger('saved');
		})
  	},
  	associate: function(){
  		model=this;
  		url='/association/'+this.id;
  		$.post(url).done(function(){
  			model.trigger('associated');
  		})
  	},
  	textFragments: function(){
  		text=this.get('parent').get('text');
  		return _.map(this.get('leftFragments'),function(frag){
  			return text.substring(frag[0],frag[0]+frag[1])
  		});
  	}
})

var DocumentList = Backbone.Collection.extend({
	model: Document,
	comparator: function(doc){return -doc.get('leftCharacters')},
	frequencies: function(){
		return this.chain()
			.invoke('textFragments')
			.flatten()
			.reduce(function(f, v) {
 				f[v] = f[v] && f[v] + 1 || 1;
 				return f;
 			}
   		,{});
	}
})

var Search = Document.extend({
	validation:{
		"text":{
			required: true,
			minLength:30
		},
		"title":{
			required: function(){return this.get("mode")=="save"}
		},
		"metaData.source":{
			required:false,
			pattern: 'url'
		}
	},
	noResults: function(){
		return this.has('success')&&!this.get('success')
	},
	hasResults: function(){
		return this.has("associations")
	},
	numResults: function(){
		return this.get("associations").length
	},
	execute: function(){
		model=this;
		$.post('/search/',{text: this.get("text")}).done(function(data){
			model.set(model.parse(data));
			if (model.hasResults()){
				model.trigger('executed');
			}
		})
	}
})
