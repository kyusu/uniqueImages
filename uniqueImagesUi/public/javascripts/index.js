$(document).ready(function () {
    var handleSuccess = function ($target) {
        var $wrapper = $target.parents('.wrapper');
        var $li = $wrapper.parent();
        $wrapper.remove();
        if ($li.find('.wrapper').length < 2) {
            $li.remove();
        }
    };
    $('button').on('click', function (e) {
        var $target = $(e.target);
        var id = $target.data('id');
        $.ajax({
            type: 'DELETE',
            url: id,
            timeout: 300,
            success: handleSuccess.bind(undefined, $target),
            error: function (xhr, type) {
                alert('Ajax error!');
            }
        });
    });
});
