/*
 * jQuery Highlight Regex Plugin
 *
 * Based on highlight v3 by Johann Burkard
 * http://johannburkard.de/blog/programming/javascript/highlight-javascript-text-higlighting-jquery-plugin.html
 *
 * (c) 2009 Jacob Rothstein
 * MIT license
 */
 
//Mods by Donovan Hide to allow className to be specified

(function($){
  $.fn.highlightRegex = function(regex,className) {
    if (className == undefined){
        className='highlight'
    }
    if(regex == undefined || regex.source == '') {
      $(this).find('span.'+className).each(function(){
        $(this).removeClass(className);
        // $(this).replaceWith($(this).text());
        $(this).parent().each(function(){
          node = $(this).get(0);
          if(node.normalize) node.normalize();
        });
      });
    } else {
      $(this).each(function(){
        elt = $(this).get(0)
        elt.normalize();
        $.each($.makeArray(elt.childNodes), function(i, node){
          // console.log(node.nodeType,$(node).text().search(regex));
          if(node.nodeType == 3) {
            var searchnode = node;
            // console.log(node,regex,$(searchnode).text().search(regex),searchnode.data.search(regex),searchnode.textContent.search(regex));
            while((pos = searchnode.data.search(regex)) >= 0) {
              match = searchnode.data.slice(pos).match(regex)[0];
              if(match.length == 0) break;
              var spannode = document.createElement('span');
              spannode.className = className;
              var middlebit = searchnode.splitText(pos);
              var searchnode = middlebit.splitText(match.length);
              var middleclone = middlebit.cloneNode(true);
              // console.log(pos,middleclone.textContent);
              // console.log(middleclone.textContent,searchnode.parentNode.textContent);
              if (searchnode.parentNode!=null && middleclone.textContent==searchnode.parentNode.textContent){   
                  $(searchnode.parentNode).addClass(className);
                  // console.log(middleclone.textContent);
              }else{
                  spannode.appendChild(middleclone);
                  searchnode.parentNode.replaceChild(spannode, middlebit);   
              }
            }
          } else {
            $(node).highlightRegex(regex,className);
          }
        })
      })
    }
    return $(this);
  }
})(jQuery);
