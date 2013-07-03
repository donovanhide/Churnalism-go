$(document).ready(function(){    
    function success(result){
        $('textarea#result').val(JSON.stringify(result,null,4));
    }
    
    $('form#api').ajaxForm({success: success});
});