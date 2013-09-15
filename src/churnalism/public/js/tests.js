module("Model Tests",{

});

asyncTest( "Search Test", function() {
	expect(3);
	search=new Search({
		text:"A Betfair sponsored race. The betting exchange has seen seven key employees"
	});
	search.on('change',function(model){
		start();
		equal(model.get("success"),true);
		notEqual(model.get("documents").first().get("fragments").length,0);
		notEqual(model.get("documents").length,0);
	})
	search.execute();
});

test("DocumentList test",function(){
	docs=new DocumentList();
	equal(docs.length,0);
});


module("View Tests",{
	setup: function(){
		stop();
		that=this;
		$.ajax({ type: "GET",
		  dataType: "text", 
		  url: '/public/index.html',
		  success: function (data) {
		  	var body = data.replace(/^[\S\s]*<body[^>]*?>/i, "")
		                    .replace(/<\/body[\S\s]*$/i, "");
		    $("#qunit-fixture").html(body);
		   	that.region=new Backbone.Marionette.Region({
				el: "#region"
			});
			start();
		  }
		});
	},
	teardown: function(){
		this.region.close();
	}
});

test("SearchView test",function(){
	search=new Search();
	searchView = new SearchView({ model: search });
	this.region.show(searchView);
	$('#text').val("test").change();
	equal(search.get("text"),"test");
	equal(search.isValid(true),false);
	$('#text').val("A much longer piece of text").change();
	equal(search.get("text"),"A much longer piece of text");
	equal(search.isValid(true),true);
	equal($('#title').is(":visible"),false);
});