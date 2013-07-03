function journalist(journalist){
    return '<a href="http://journalisted.com/'+journalist.journalisted_id+'" target="_blank">'+journalist.name+'</a>';
}
function press_release(press_release){
    return '<a href="/'+press_release.short_title+'">'+press_release.title+'</a>';
}

function multiple(article,property,func){
    var string ="";
    if (article.item[property].length){
        for (var i=0;i<(article.item[property].length-1);i++){
            string+=(func(article.item[property][i])+', ');
        }
        string+=func(article.item[property][article.item[property].length-1]);
    }
    return string;
}
function journalists(article){
    return multiple(article,'journalists',journalist)
}

function score(article){
    return Math.ceil(article.item.score*3);
}

function press_releases(article){
    var string= "";
    string+='<a class"title" href="/'+article.item.press_releases[0].short_title+'#'+article.item.id+'">'+article.item.title+'</a>';
    for (var i=1;i<article.item.press_releases.length;i++){
        string+=' <a class="morepr" href="/'+article.item.press_releases[i].short_title+'#'+article.item.id+'">['+(i+1)+']</a>';
    }
    return string;
}

function visualisation(article){
    return Math.round(article.item.score*100);
}

var resultsDirective = {
  'div.article'   : {
    'article<-articles':{
        '@id'                            : 'article.id',
        'div.quality@score'              : score,
        'div.quality@id'                 : 'quality-#{article.id}',
        'p.press_releases'               : press_releases,
        'p a.newspaper'                  : 'article.newspaper',
        'p a.newspaper@href'             : 'http://journalisted.com/article/#{article.id}',
        'span.published'                 : 'article.published',
        'p.journalists'                  : journalists,
        'div.visualisation@score'        : visualisation
    }
  }
};

$(document).ready(function(){
    //Initialise template
    var articlesTemplate = $('div#articlesTemplate').compile(resultsDirective);
    
    //Clear up
    function clear(){
        $('div#results div#articles').isotope('remove',$('div#results div.article')).isotope('reLayout');    
        $('div#results span#countDescription').empty();
    }
    
    //Update Share bar
    function updateShare(){
        $('input#shareUrl').val(window.location.href);
        var text = encodeURIComponent('Explore #churnalism by source of press release and outlet published');
        var url = encodeURIComponent(window.location.href);
        $('a.twitterIcon').attr('href',"http://twitter.com/share?url="+url+"&text="+text+"&related=churnalert&via=churnalert");
        $('a.facebookIcon').attr('href',"http://www.facebook.com/sharer.php?u="+url+"&t="+text);
    }
    
    //Pad Base36
    function encodeHash(hash){
        var num=Number(hash).toString(36);
        return "0".substr(0, 2 - String(num).length) + num; 
    }
    
    //Interpret hashes
    function interpretHash(){
        var hash=window.location.hash.slice(1);
        if (hash){
            $('li.selected').removeClass('selected');
            $('li.scraper[id='+parseInt(hash.slice(0,2),36)+']').addClass('selected');
            $('li.source[id='+parseInt(hash.slice(2,4),36)+']').addClass('selected');
            $('select#sort').val(hash.slice(4,5));
        }
    }
    
    //Set hash
    function setHash(){
        var hash=encodeHash($('li.scraper.selected').attr('id'));
        hash+=encodeHash($('li.source.selected').attr('id'));
        hash+=$('select#sort').val();
        window.location.hash=hash;
    }
    
    function countDescription(count){
        return count+' articles from <em>'+$('li.scraper.selected').text()+'</em> + <em>'+$('li.source.selected').text()+'</em> are possibly churn';
    }
    
    //Load churn
    function browse(){
        $('div#exploreLoading').show();
        $.ajax({
                    url     : '/browse/',
                    type    : 'POST',
                    data    : {
                                    scraper : $('li.scraper.selected').attr('id'),
                                    source  : $('li.source.selected').attr('id'),
                                    sort    : $('select#sort').val(),
                                    page    : Math.floor(($('div.article').length)/50)
                    },  
                    success : function(json){
                                        $('div#exploreLoading').hide();
                                        $('div#results span#countDescription').html(countDescription(json.count)).attr('count',json.count);
                                        $('div#articlesTemplate').render(json,articlesTemplate);
                                        if (!($.browser.msie && parseInt($.browser.version.substring(0,1))<9)){
                                            $('div#articlesTemplate div.visualisation').drawMiniChurn({
                                                LINE_LENGTH : 9.75,
                                                SCALE       : 16
                                            });   
                                        }else{
                                            $('div#articlesTemplate div.visualisation').remove();
                                        }
                                        $('div.quality:empty').each(function(){
                                            $(this).raty({
                                                                        starOn      : 'recycle-small-on.png',
                                                                        starOff     : 'recycle-small-off.png',
                                                                        hintList    : ['possibly', 'probably', 'definitely'],
                                                                        number      : 3,
                                                                        readOnly    : true,
                                                                        path        : '/static/images/',
                                                                        start       : $(this).attr('score')
                                                           }); 
                                        });
                                        var churn = $('div#articlesTemplate div.article');
                                        $('div#results div#articles').append(churn).isotope('insert',churn);
                    }
        });
    }

    //Filter and sort clicks
    $('ul#scraper li,ul#source li').click(function(){
        $(this).addClass('selected').siblings('.'+$(this).attr('class').split(' ')[0]).removeClass('selected');
        clear();
        setHash();
    });
    $('select#sort').change(function(){
       clear();
       setHash(); 
    });

    //Load more articles
    $(window).scroll(function () {
        if ($(window).scrollTop() == $(document).height() - $(window).height()) {
            if ($('div.article').length<parseInt($('span#countDescription').attr('count'))){
                browse();   
            }
        }
    });
    
    //React to hash changes
    $.address.internalChange(function(){
        interpretHash();
        updateShare();
        browse();
    })

    $.address.externalChange(function(){
        clear();
        interpretHash();
        updateShare();
        browse();
    })

    //Initialise isotope
    $('div#results div#articles').isotope({
            animationEngine : 'none',
            itemSelector    : 'div.article',
            masonry         : {
                                columnWidth : 164
                              },
    });


    $('div#share').show();
    $('div#utilities').addClass('grey').removeClass('lightgrey');    
});
