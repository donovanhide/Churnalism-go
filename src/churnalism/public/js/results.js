$(document).ready(function(){    
    function getShortTitle(){
        return $('input[name=short_title]').val();
    }
    
    function setShortTitle(short_title){
        $('input[name=short_title]').val(short_title);
    }
    
    function getCleanText(){
        return $('textarea[name="article.Text"]').val().replace(/\n/g, "<br/>").replace(/\n\n+/g, '<br/><br/>').replace(/(\<\/?)script/g,"$1noscript");
    }
    
    function sendData(form){
            change_state("searching");
            $(form).ajaxSubmit({         
                                    url         : '/search/',
                                    success     : function(json){
                                                                if (json.count>0){
                                                                    setShortTitle(json.short_title);
                                                                    $('html').data('results',json);
                                                                    $.address.value('results');
                                                                    change_state('results');   
                                                                }else{
                                                                    change_state('noresults');
                                                                }
                                                }
            });
    }
    
    function ensureData(state){
        if ($('html').data('results')){
            change_state(state);
        }
        else{
            $.ajax({
                         url         : '/retrieve/?short_title='+getShortTitle(),
                         success     : function(json){
                                                    if (json.count == 0){
                                                          change_state("noresults");
                                                    }else{
                                                        setShortTitle(json.short_title);
                                                        $('html').data('results',json);
                                                        change_state(state);
                                                    }
                         },
                         beforeSend  : function(){
                                                    change_state("searching");
                         }
                 });
        }
    }
    
    function getData(){
        return $('html').data('results');
    }

    function getArticle(id){
        return $.grep(getData().articles,function(val){return val.id==id;})[0];
    }
    
    function getWordsForArticle(id){
        var snippets = getArticle(id).snippets;
        var words = [];
        for (var i=2;i<snippets.length;i+=3){
            words.push(getData().words[snippets[i]]);
        }
        return words.sort(function(a,b){return b.length-a.length;});
    }

    function resultsCount(item){
        var count = item.context.count;
        var plural = (count>1)?'s':'';
        return count+' news article'+plural+' may be churnalism';
    }
    
    function score(article){
        return Math.ceil(article.item.score*3);
    }
    
    function rating(article){
        return Math.ceil(article.item.rating*3);
    }
    
    function similarity(article){
        return Math.round((article.item.similar/article.context.characters)*100)+"%";  
    }
    
    function recycling(article){
        return Math.round((article.item.recycled/article.item.characters)*100)+"%";
    }
    
    function visualisation(article){
        return Math.round((article.item.recycled/article.item.characters)*100);
    }
    
    function journalist(journalist){
        return '<a href="http://journalisted.com/'+journalist.journalisted_id+'" target="_blank">'+journalist.name+'</a>';
    }
    
    function journalists(article){
        var string ="";
        if (article.item.journalists.length){
            for (var i=0;i<(article.item.journalists.length-1);i++){
                string+=(journalist(article.item.journalists[i])+', ');
            }
            string+=journalist(article.item.journalists[article.item.journalists.length-1]);
        }
        return string;   
    }
    
    function articleLink(article){
        return getData().shared?('#'+article.item.id):'#save';
    }
    
    var resultsDirective = {
      'th#count'    : resultsCount,    
      'tr.result'   : {
        'article<-articles':{
            '@id'                            : 'article.id',
            'div.quality@score'              : score,
            'div.quality@id'                 : 'quality-#{article.id}',
            'td.article a.title'             : 'article.title',
            'td.article a.title@href'        : 'article.newspaper_link',
            'td.article a.newspaper'         : 'article.newspaper',
            'td.article a.newspaper@href'    : 'http://journalisted.com/article/#{article.id}',
            'td.article span.published'      : 'article.published',
            'td.article p.journalists'       : journalists,
            'p.characters'                   : 'article.similar',
            'p.similarity'                   : similarity,
            'p.recycling'                    : recycling,
            'a.handleft@href'                : articleLink,
            'div.visualisation@score'        : visualisation
        }
      }
    };

    var resultsTemplate = $('table#results').compile(resultsDirective);

    var sidebysideDirective = function(id) {
        return {    'div#sidebyside':{
                        'article<-articles' :{
                            'h4.title'                      : 'article.title',
                            'p.similarity'                  : similarity,
                            'p.recycling'                   : recycling,
                            'p.characters'                  : 'article.similar',
                            'div.yourrating@id'             : 'article.id',
                            'div.yourrating@score'          : rating,
                            'div.ourrating@score'           : score,
                            'div.details a.title'           : 'article.title',
                            'div.details a.title@href'      : 'article.newspaper_link',
                            'div.details a.newspaper'       : 'article.newspaper',
                            'div.details a.newspaper@href'  : 'http://journalisted.com/article/#{article.id}',
                            'div.details span.published'    : 'article.published',
                            'div.details p.journalists'     : journalists
                        },
                        filter  : function(article){
                                                        return article.item.id==id;
                                                    }   
                } 
        };
    };
        
    function highlightChurn(snippet,className){
        // console.log(snippet);
        $('div#fullText span.feint').each(function(index,element){
            if ($(element).text().search(snippet)==0){
                $(element).find('*').andSelf().addClass(className);
            }
        });
    }
    
    function animateChurn(el,colour){  
          var set = el.paper.set();
          $.each($('div#churnograph').data('churns_set'),function(){
              if ($(this).data('snippetText')==$(el).data('snippetText')){
                  set.push(this);
              }              
          });
          //BUG:http://groups.google.com/group/raphaeljs/browse_thread/thread/1d5988782044b053/3e95675429f9a952?lnk=gst&q=hover+tofront#3e95675429f9a952
          if ($.browser.msie){
              set.animate({fill:colour}, 100);
          }
          else{
              set.toFront().animate({fill:colour}, 100);   
          }
      }
    
    function churnHoverIn(event){
        animateChurn(this,'#e30b13');  
        highlightChurn($(this).data('snippetRegex'),'highlight');
        console.log($(this).data('snippetRegex').source);
    }
    
    function churnHoverOut(event){
        animateChurn(this,'#f9a803');  
        $('div#fullText span.feint').removeClass('highlight');
    }
    
    function churnShow(regex){
        highlightChurn(regex,'highlight');
    }
    
    function truncateText(){
        $('div#text').truncate({
                maxLength:600,
                more: 'View full text',
                less: 'View less text'
        });
    }
    
    function buildRatings(elements,readOnly){
        $(elements).each(function(){
                                        $(this).raty({
                                                                    starOn      : 'recycle-on.png',
                                                                    starOff     : 'recycle-off.png',
                                                                    hintList    : ['possibly', 'probably', 'definitely'],
                                                                    number      : 3,
                                                                    readOnly    : readOnly,
                                                                    path        : '/public/images/',
                                                                    start       : $(this).attr('score')
                                                       });
                                         if(!readOnly){$(this).click(function(){
                                             var rating = this;
                                             $.post('/rate/',{
                                                                 news_article    : $(this).attr('id'),
                                                                 press_release   : getShortTitle(),
                                                                 score           : $(this).find('input[name=score]').val()
                                                             },function(data){
                                                                 if (data.success){
                                                                     $(rating).effect("highlight", {}, 750);
                                                                 }
                                                             });
                                            });
                                        }
        });
    }
    
    function change_state(state){
        console.log(state);
        $("#tabs").tabs({cookie: { expires: 30, path:'/' }});
        var text = encodeURIComponent('An example of #churnalism: "'+$.trim(document.title.split('|')[1])+'"');
        var url = encodeURIComponent(window.location.href);
        $('a.twitterIcon').attr('href',"http://twitter.com/share?url="+url+"&text="+text+"&related=churnalert&via=churnalert");
        $('a.facebookIcon').attr('href',"http://www.facebook.com/sharer.php?u="+url+"&t="+text);
        $('div#utilities').toggleClass('lightgrey',state!='sidebyside'&& state!='saved').toggleClass('grey',!(state!='sidebyside'&& state!='saved'));
        switch(state){
            case "search":
                $('div#textEntered,div#searching,div#noresults,div#warningBox,table#results').hide();
                $('div#search').show();
                break;
            case "searching":
                if (getCleanText().length>0){
                    $('div#textEntered div#text').html(getCleanText());     
                }
                truncateText(); 
                $('div#noresults,div#search').hide();
                $('div#searching,div#textEntered').show();
                break;
            case "results":
                $('table#results').render(getData(),resultsTemplate).find('div.visualisation').drawMiniChurn();
                buildRatings('div.quality',true);
                $('div#share,div#searching').hide();
                $('table#results,div#warningBox').show();
                break;
            case "saved":
                $('table#results').render(getData(),resultsTemplate).find('div.visualisation').drawMiniChurn();
                $('p.warningLine,div#sidebyside,div#searching').hide();
                buildRatings('div.quality',true);
                $('div#home,div#textEntered,table#results,div#share').show();
                break;
            case "noresults":
                $('div#searching').hide();
                $('div#noresults').show().effect("highlight", {}, 750);
                break;
            case "sidebyside":
                window.scrollTo(0, 0);  
                if ($('body').data('textCache')){
                    $('div#fullText').html($('body').data('textCache'));
                }else{
                    $('body').data('textCache',$('div#fullText').html());
                }
                $('div#main').render(getData(),sidebysideDirective($.address.value()));
                $('div.ourrating,div.yourrating').empty();
                buildRatings('div.ourrating',true);
                buildRatings('div.yourrating',false);    
                var churnOptions = {
                            WIDTH           : 357, 
                            BLOCK_HEIGHT    : 2000,
                            MAX_LENGTH      : 357,
                            LINE_HEIGHT     : 11, 
                            LINE_OFFSET     : 14,
                            SCALE_FACTOR    : 1
                };
                $('div#churnograph').empty().drawChurn($.address.value(),getData(),'div#churnograph',churnShow,churnHoverIn,churnHoverOut,churnOptions);
                $.each(getWordsForArticle($.address.value()),function(){
                    $('div#fullText').highlightRegex(RegExp(RegExp.escape($.trim(this)),'ig'),'feint'); 
                });
                $('div#home').hide();
                $('div#sidebyside,div#share').show();
                break;
            default:
                break;
        }
    }
    
    function handleAddressChange(event){
        if (window.location.href.slice(-1)=='#'){
            $('input#shareUrl').val(window.location.href.slice(0,-1));
        }
        else{
            $('input#shareUrl').val(window.location.href);
        }
        switch(event.value){
            case "results":
                    if (event.type=="externalChange"){
                        $.address.value(''); 
                    }
                    break;
            case "reset":
                    $.address.value('');
                    break;
            case "/":
                    if (window.location.pathname!="/"){
                        ensureData("saved");
                    }else{
                        change_state("search");
                    }
                    break;
            default:
                    ensureData("sidebyside");
                    break;
        }
    }
    
    $.address.internalChange(handleAddressChange);
    $.address.externalChange(handleAddressChange);

    $('form#churn').validate({
        submitHandler:  sendData,
        errorPlacement: function(error,element){}
    });
    
    $('form#saveChurn').validate({
        errorPlacement: function(error,element){}
    });

    $('a#search').click(function(){
       $('form#churn').submit();
       return false; 
    });

    $(".datepicker").datepicker({
       onSelect: function(){$(this).removeClass('placeholder');},
       onClose: function(){this.focus();} 
    });
    
    $('textarea[help]').tipsy({
                                trigger : 'focus',
                                title   : 'help',
                                gravity : function(){return $(this).attr('gravity');},
                                offset  : 20
    });
    $('input[help]').tipsy({
                                trigger : 'focus',
                                title   : 'help',
                                gravity : function(){return $(this).attr('gravity');},
								offset  : 10
    });
    $('a[href="#save"]').tipsy({
                                live    : true,
                                html    : true,
                                title   : function(){return 'Please <b>save</b> the entered text to view the side-by-side page';},
                                gravity : 's',
								offset  : 10
    }).on('click',function(){return false;});
    
    $('select[name=source]').change(function(){
        $("select[name=source] option:selected").each(function () {  
              $('div.url-spacer').remove();
              if ($(this).text()=="Web"){
                  $('input[name=source_link]').show().addClass('notplaceholder complete_url').removeAttr('disabled','');
              }
              else{
                  $('input[name=source_link]').hide().removeClass('notplaceholder complete_url').attr('disabled','disabled').after('<div class="url-spacer"></div>');
              }
        });                                
    });
    $('form#saveChurn').resetForm();
    $(':input').placeholder();
    $('a.reset').address();
});