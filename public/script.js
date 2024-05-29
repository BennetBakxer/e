document.addEventListener('DOMContentLoaded', function() {
    const mobileSearchIcon = document.getElementById('mobile_search');
    const searchBar = document.getElementById('search-bar');

    mobileSearchIcon.addEventListener('click', function() {
        if (window.innerWidth <= 767) {
            searchBar.style.display = searchBar.style.display === 'block' ? 'none' : 'block';
        }
    });

    window.addEventListener('resize', function() {
        if (window.innerWidth > 767) {
            searchBar.style.display = 'none';
        }
    });
});
