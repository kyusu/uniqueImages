const handleSuccess = function (id) {
    const wrappers = Array.from(document.querySelectorAll(`[data-id="${id}"]`));
    wrappers.forEach(wrapper => {
        const li = wrapper.parentElement;
        wrapper.remove();
        if (li.querySelectorAll('.wrapper').length < 2) {
            li.remove();
        }
    });
};

window.addEventListener('load', () => {
    document.querySelector('body').addEventListener('click', ({target}) => {
        if (target.tagName.toLowerCase() === 'button') {
            const url = target.getAttribute('data-url');
            window.fetch(url, {method: 'DELETE'}).then(response => {
                if (response.status === 200) {
                    handleSuccess(url);
                } else {
                    alert('Server error!');
                }
            });
        }
    });
});
