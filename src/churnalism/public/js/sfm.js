_.mixin(_.str.exports());

var Document = Backbone.Model.extend({
	url: function(){
		return "/document/"+this.id.doctype+"/"+this.id.docid+"/";
	},
	idAttribute: 'id2',
	groupedAssociations: function(field){
		return new Backbone.Collection(_.map(this.get('associations').groupBy(function(doc){
			return doc.get('metaData')[field];
		}),function(docs,group){
			return {
				name: group,
				associations: new DocumentList(docs)
			}
		}));
	},
	parse: function(response){
		if (_.has(response,"id")){
			response.id2=response.id.doctype+"/"+response.id.docid+"/"
		}
		if (_.has(response,"associations")){
			associations=_.map(response["associations"],function(a){
				return _.extend(a,{parent:this})
			},this)
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
    		if ((_.last(merged)[0]+_.last(merged)[1])>(value[pos]+value[2])){
    			_.last(merged)[1]=value[pos]+value[2]-_.last(merged)[0]
    		}else{
    			merged.push([value[pos],value[2]])
    		}
    	})
    	return merged;
    }
})

var DocumentList = Backbone.Collection.extend({
	model: Document,
	comparator: function(doc){return -doc.get('leftCharacters')}
})

var Search = Document.extend({
	validation:{
		text:{
			required: true,
			minLength:30
		},
		title:{
			required: function(){return this.get("mode")=="save"}
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
	},
	save: function(fields){
		$.post('/save/',this.pick(fields)).done(function(data){
			model.trigger('saved',data.source);
		})
  	},
})
