//Console overrides for when Firebug is absent
if (!window.console) {console = {};}
console.log = console.log || function(){};
console.debug = console.debug || function(){};
console.info = console.info || function(){};
console.warn = console.warn || function(){};
console.error = console.error || function(){};
console.assert = console.assert || function(){};
console.dir = console.dir || function(){};
console.dirxml = console.dirxml || function(){};
console.trace = console.trace || function(){};
console.group = console.group || function(){};
console.groupEnd = console.groupEnd || function(){};
console.time = console.time || function(){};
console.timeEnd = console.timeEnd || function(){};
console.profile = console.profile || function(){};
console.profileEnd = console.profileEnd || function(){};
console.count = console.count || function(){};

//Escape HTML to be used as a regular expression
RegExp.escape = function(str) 
{
  var specials = new RegExp("[.*+?|()\\[\\]{}\\\\]", "g"); // .*+?|()[]{}\
  return str.replace(specials, "\\$&");
};

//String helpers
String.prototype.repeat = function(num)
{
    return new Array(isNaN(num)? 1 : ++num).join(this);
};

(function($){

  addChunk = function(paragraphs,total,chunk,maxlength,background){
       do{
           var length=0,
               startLine=Math.floor(total/maxlength),
               endLine=Math.floor((total+chunk)/maxlength);
            //If passes end of line
            if (startLine!=endLine){
               length=maxlength-(total-(startLine*maxlength));
            }
            else{
                length=chunk;
            }
            paragraphs.push({
                              length:length,
                              background: background
                           });
            chunk-=length;
            total+=length;
        }while(chunk>0);
        return total;
  };

  generateChurn = function(value,maxlength){
      Math.seedrandom(value);
      var churnCount=(value+1)/6,
          churns=[],
          gaps=[],
          paragraphs=[],
          churnsTotal=0,
          gapsTotal=0,
          paragraphsTotal=0;
      for (var i=0;i<churnCount;i++){
          churns.push(Math.random());
          gaps.push(Math.random());
          churnsTotal+=churns[i];
          gapsTotal+=gaps[i];
      }
      // console.log(churns,gaps);
      for (var i=0;i<churnCount;i++){
          var gap = Math.round((gaps[i]/gapsTotal)*(100-value)),
              churn = Math.round((churns[i]/churnsTotal)*(value));
          addChunk(paragraphs,paragraphsTotal,gap,maxlength,true);
          paragraphsTotal+=gap;
          addChunk(paragraphs,paragraphsTotal,churn,maxlength,false);
          paragraphsTotal+=churn;
      }
      paragraphs[paragraphs.length-1].length = (100-paragraphsTotal);
      return paragraphs;
  };    
    
  $.fn.drawMiniChurn = function(options){
      return this.each(function(){
          var paper = Raphael($(this).get(0), $(this).width(), $(this).height()),
              value = parseInt($(this).attr('score'),10),
              foregroundSet = paper.set(),
              backgroundSet = paper.set(),
              settings = { 
                            LINE_LENGTH     : 17,
                            LINE_HEIGHT     : 7,
                            BLOCK_HEIGHT    : 5,
                            SCALE           : 5
                         };
           if (options){
               $.extend(settings,options);
           }
            function drawBlock(line,offset,length,background){
                  var width = length*settings.SCALE,
                      start = (offset%settings.LINE_LENGTH)*settings.SCALE,
                      top = line*settings.LINE_HEIGHT,
                      set = background?backgroundSet:foregroundSet;
                  // console.log(line,offset,length,start,width,background);
                  set.push(paper.rect(start,top,width,settings.BLOCK_HEIGHT));   
            }

            var paragraphs=generateChurn(value,settings.LINE_LENGTH);
            // console.log(paragraphs);

            var total=0;
            for(var i=0;i<paragraphs.length;i++){
                var current=paragraphs[i],
                    line=Math.floor(total/settings.LINE_LENGTH);
                drawBlock(line,total,current.length,current.background);
                total+=current.length;
            }
            backgroundSet.attr({fill:'black',stroke:'none',opacity:'1.0'});
            foregroundSet.attr({fill:'orange',stroke:'none',opacity:'1.0'});  
      });
  };

  //Draw the churn-o-graph!
  $.fn.drawChurn = function(id,data,target,churnShow,hover_in,hover_out,options){
      var empty = {};
      var defaults = { 
                            WIDTH           : $(this).innerWidth(),
                            HEIGHT          : $(this).innerHeight(),
                            SCALE_FACTOR    : 1,                        // Factor to make whole image bigger/smaller
                            MAX_LENGTH      : 200,                      // Length of line in characters
                            LINE_HEIGHT     : 8,                        // Height of line in pixels
                            LINE_OFFSET     : 10,                       // Vertical gap in pixels
                            BLOCK_HEIGHT    : 350,                      // Height of block in pixels
                            GUTTER          : 4                         // Gap between blocks in pixels
                     };
      var settings = $.extend(empty, defaults, options);
      var article = $.grep(data.articles,function(n,i){return n.id==id;})[0];
      var paragraphs = article.paragraphs;
      //Look up churn from the words array
      var churn = [];
      $.extend(churn,article.snippets);
      for (var i=2;i<churn.length;i+=3){
          churn[i]=data.words[churn[i]];
      }
      // churn.sort(function(a,b){return a[0] == b[0] ? 0 : a[0] < b[0] ? -1 : 1;});
      var paper = Raphael($(this).get(0), settings.WIDTH, settings.HEIGHT);
      var paragraphs_set = paper.set();
      var churns_set = paper.set();
      var offset=0;
      var churn_index=0;
      // console.log(paragraphs);
      for (var j=0;j<paragraphs.length;j+=2){
          var start = paragraphs[j];
          var end = paragraphs[j+1];
          var paragraph_length=end-start;
          var lines = Math.floor(paragraph_length/settings.MAX_LENGTH);
          for (var i=0;i<=lines;i+=1){
                var remainder = Math.abs(paragraph_length-(i*settings.MAX_LENGTH));
                var line_length = ((remainder>settings.MAX_LENGTH)?settings.MAX_LENGTH:remainder);
                var line_start = start+(i*settings.MAX_LENGTH);
                var line_end = line_start+line_length;
                var width = line_length/settings.SCALE_FACTOR;
                var x = (Math.floor(offset/settings.BLOCK_HEIGHT)*((settings.MAX_LENGTH+settings.GUTTER)/settings.SCALE_FACTOR));
                var y = (offset%settings.BLOCK_HEIGHT)/settings.SCALE_FACTOR;
                // console.log('lines:'+lines+' start: '+start+" end: "+end+" line start: "+line_start+" line end: "+line_end+" offset: "+offset+" i: "+i+" remainder:"+remainder+" width: "+width+" x: "+x+" y: "+y);
                paragraphs_set.push(paper.rect(x, y, width,settings.LINE_HEIGHT/settings.SCALE_FACTOR));
            
                //Draw the churn highlight
                while(churn_index<churn.length){
                    var churn_start = churn[churn_index];
                    var churn_end = churn[churn_index+1];
                    var snippet = churn[churn_index+2];
                    // console.log('line start: '+line_start+' line end: '+line_end+' churn start: '+churn_start+' churn end: '+churn_end);
                    if ((churn_start>=line_start && churn_start<=line_end)||(churn_end>=line_start && churn_end<=line_end)){
                        var churn_start_x = Math.max(x,x+((churn_start-line_start)/settings.SCALE_FACTOR));
                        var churn_end_x = Math.min(x+width,x+(Math.abs(churn_end-line_start)/settings.SCALE_FACTOR));
                        var churn_width = churn_end_x-churn_start_x;
                        // console.log('churn start x: '+churn_start_x+' churn end x: '+churn_end_x+' churn width: '+churn_width+' x: '+x+' width:'+width);
                        var churn_block = paper.rect(churn_start_x,y,churn_width,settings.LINE_HEIGHT/settings.SCALE_FACTOR);
                        var snippetText = $.trim(snippet);
                        var snippetRegex = RegExp(RegExp.escape(snippetText),'ig');
                        churnShow(snippetRegex);
                        $(churn_block).data('snippetRegex',snippetRegex).data('snippetText',snippetText);
                        churn_block.hover(hover_in,hover_out);
                        churn_block.node.style.cursor = "pointer";
                        churns_set.push(churn_block);
                        if (churn_end>line_end){ 
                            break;
                        }
                        else{
                            churn_index+=3;  
                        }
                    }
                    else{
                        break;
                    }
                }
                offset+=settings.LINE_OFFSET;
            }
      }
      paragraphs_set.attr({fill:'black',stroke:'none',opacity:'1.0'});
      churns_set.attr({fill:'orange',stroke:'none',opacity:'1.0'});
      $('rect').attr('shape-rendering','optimizeSpeed');
      $(this).data('churns_set',churns_set);
      paper.setSize(settings.WIDTH,y+settings.LINE_HEIGHT);
      // paper.safari();
      return this;
  };
  
  //Build the category autocomplete
  $.widget( "custom.catcomplete", $.ui.autocomplete, {
          _renderMenu: function( ul, items ) {
              var self = this,
                  currentCategory = "";
              $.each( items, function( index, item ) {
                  if ( item.category != currentCategory && item.category!==null ) {
                      ul.append( "<li class='ui-autocomplete-category'>" + item.category + "</li>" );
                      currentCategory = item.category;
                  }
                  self._renderItem( ul, item ).hover(function(){$(this).toggleClass('active');});
              });
          }
      });
  
  //Set datepicker defaults
  $.datepicker.setDefaults({
                                closeText: 'Done',
                                prevText: 'Prev',
                                nextText: 'Next',
                                currentText: 'Today',
                                monthNames: ['January','February','March','April','May','June',
                                'July','August','September','October','November','December'],
                                monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                                dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                                dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                                dayNamesMin: ['S','M','T','W','T','F','S'],
                                weekHeader: 'Wk',
                                dateFormat: 'dd/mm/yy',
                                firstDay: 1,
                                isRTL: false,
                                showMonthAfterYear: false,
                                yearSuffix: ''
    });
    
    //Add some custom validators
    $.validator.addMethod("churntext", function(value, element) {
        return this.optional(element) || $(element).attr('placeholder')!=value;
    },'Please paste your press release here'); 

    $.validator.addMethod("notplaceholder", function(value, element) {
        return this.optional(element) || $(element).attr('placeholder')!=value;
    },'This field is required');

    $.validator.addMethod("complete_url", function(val, elem) {
        if (val.length == 0) { return true; }
        if(!/^(https?|ftp):\/\//i.test(val)) {
            val = 'http://'+val; // set both the value
            $(elem).val(val); // also update the form element
        }
        return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&amp;'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&amp;'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&amp;'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&amp;'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&amp;'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(val);
    });    
    
    //http://www.adamcoulombe.info/lab/jquery/width-truncate/jquery.widthTruncate.js
    $.fn.extend({
        widthTruncate: function(opts) {
            var defaults = {
                width: 'auto',
                after: '...'
            };
            var options = $.extend(defaults, opts);
            return this.each(function() {
                if(options.width=='auto'){ truncateWidth=$(this).width()-8; }else{ truncateWidth = options.width;}
                if($(this).width()>truncateWidth){      
                var smaller_text = $(this).text();
                $(this).html('<span id="truncateWrapper" style="display:inline;">'+options.after+'</div>');
                    i=1;
                     while ($('#truncateWrapper').width() < truncateWidth) {
                        $('#truncateWrapper').html(smaller_text.substr(0, i) + options.after);
                        i++;
                    }
                    $(this).html($('#truncateWrapper').html());
                }
              });
          }
    });
})( jQuery );

$(document).ready(function(){
    //http://docs.djangoproject.com/en/dev/releases/1.3/
    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            function getCookie(name) {
                var cookieValue = null;
                if (document.cookie && document.cookie != '') {
                    var cookies = document.cookie.split(';');
                    for (var i = 0; i < cookies.length; i++) {
                        var cookie = jQuery.trim(cookies[i]);
                        // Does this cookie string begin with the name we want?
                        if (cookie.substring(0, name.length + 1) == (name + '=')) {
                            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                            break;
                        }
                    }
                }
                return cookieValue;
            }
            if (!(/^http:.*/.test(settings.url) || /^https:.*/.test(settings.url))) {
                // Only send the token to relative URLs i.e. locally.
                xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
            }
        }
    });
    
    
    //Make the hover tipsy work for header and others
    $('.tipsy-hover').tipsy({
                                title   : 'help',
                                gravity : 'sw',
                                html    : true,
                                offset  : 10,
                                // live    : true
                           });
   //Autocomplete box
   $('input#search').catcomplete({
       source   : '/suggest/',
       appendTo : 'div#suggestions',
       select   : function(event, item) {
                                           window.location.href = "/"+item.item.url;
                                       }
   });
   
   $('a.twitterIcon,a.facebookIcon,div#clipboard').tipsy({
                               title   : 'help',
                               gravity : function(){return $(this).attr('gravity');},
                               offset  : 10
   });
   
  //Clipboard icon
  var clip = new ZeroClipboard( document.getElementById("div#clipboard"), {
    moviePath: "/public/swf/ZeroClipboard.swf"
  });
  clip.on('complete',function(){
    $('div#clipboard').attr('help','Copied!').tipsy('hide').tipsy('show');
    clip.setText($('input#shareUrl').val());
  });
  clip.on('onMouseOut',function(el){
    $('div#clipboard').tipsy("hide").attr('help','Copy to clipboard');
  });
   // $('div#clipboard').html(clip.getHTML(16,16));   
});
