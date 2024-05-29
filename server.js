import express from 'express';
import fetch from 'node-fetch';
import cheerio from 'cheerio';

const app = express();
const PORT = 3000;

app.use(express.static('public'));

app.get('/proxy', async (req, res) => {
    try {
        const response = await fetch('https://hentaix.io');
        const data = await response.text();
        res.send(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Server error');
    }
});

app.get('/anime-details', async (req, res) => {
    const { title } = req.query;
    const animeSlug = title.toLowerCase().replace(/\s+/g, '-');
    const url = `https://hentaix.io/${animeSlug}/`;

    try {
        const response = await fetch(url);
        const data = await response.text();
        const $ = cheerio.load(data);

        const titleElement = $('.elementor-heading-title');
        const videoIframe = $('iframe');
        const imageSrc = $('.elementor-widget-image img').attr('src');
        const quality = $('.elementor-element-55d8164 .elementor-widget-container').text().trim();
        const category = $('.elementor-post-info__terms-list-item').text().trim();
        const releaseDate = $('.elementor-element-7a93548f .elementor-widget-container').text().trim();
        const description = $('.elementor-element-57acb04d .elementor-widget-container').text().trim();
        const relatedHentais = [];

        $('.rp4wp-related-posts li').each((i, el) => {
            const relatedTitle = $(el).find('.rp4wp-related-post-content a').text();
            const relatedUrl = $(el).find('.rp4wp-related-post-content a').attr('href');
            const relatedImage = $(el).find('img').attr('src');
            relatedHentais.push({ title: relatedTitle, url: relatedUrl, image: relatedImage });
        });

        res.json({
            title: titleElement.text().trim(),
            videoUrl: videoIframe.attr('src'),
            imageSrc,
            quality,
            category,
            releaseDate,
            description,
            relatedHentais
        });
    } catch (error) {
        console.error('Error fetching anime details:', error);
        res.status(500).send('Server error');
    }
});

app.get('/video', async (req, res) => {
    const url = req.query.url;
    console.log('Requested URL:', url);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch the URL, status: ${response.status}`);
        }
        const body = await response.text();
        const $ = cheerio.load(body);
        const iframeSrc = $('.player_logic_item iframe').attr('src');
        console.log('Iframe source:', iframeSrc);

        if (iframeSrc) {
            res.json({ success: true, iframeSrc });
        } else {
            res.status(404).json({ success: false, message: 'Iframe not found' });
        }
    } catch (error) {
        console.error('Error fetching video page:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

app.get('/proxy-video', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) {
        res.status(400).send('No video URL provided');
        return;
    }

    try {
        const videoResponse = await fetch(videoUrl);
        const videoStream = videoResponse.body;
        videoStream.pipe(res);
    } catch (error) {
        console.error('Error proxying video:', error);
        res.status(500).send('Error proxying video');
    }
});

app.get('/search', async (req, res) => {
    const query = req.query.s;
    if (!query) {
        res.redirect('/');
        return;
    }

    const url = `https://hentaix.io/?s=${encodeURIComponent(query)}&asp_active=1&p_asid=2&p_asp_data=1&filters_initial=1&filters_changed=0&qtranslate_lang=0&current_page_id=75`;

    try {
        const response = await fetch(url);
        const data = await response.text();
        const $ = cheerio.load(data);
        const results = [];

        $('.mh-posts-list-item').each((i, el) => {
            const title = $(el).find('.entry-title a').text().trim();
            const link = $(el).find('.entry-title a').attr('href');
            const thumbnail = $(el).find('.mh-posts-list-thumb img').attr('src');
            const category = $(el).find('.mh-image-caption').text().trim();

            results.push({ title, link, thumbnail, category });
        });

        res.json(results);
    } catch (error) {
        console.error('Error performing search:', error);
        res.status(500).send('Failed to perform search');
    }
});

app.get('/categories', async (req, res) => {
    try {
        const response = await fetch('https://hentaix.io');
        const data = await response.text();
        const $ = cheerio.load(data);
        const categories = [];

        $('.elementor-widget-image').each((i, el) => {
            const categoryLink = $(el).find('a').attr('href');
            const categoryImage = $(el).find('img').attr('src');
            const categoryName = $(el).find('figcaption').text().trim();
            categories.push({ link: categoryLink, image: categoryImage, name: categoryName });
        });

        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).send('Failed to fetch categories');
    }
});

app.get('/trending', async (req, res) => {
    const url = 'https://hentaix.io/harem/';

    try {
        const response = await fetch(url);
        const data = await response.text();
        const $ = cheerio.load(data);
        const results = [];

        $('article.mh-posts-list-item').each((i, el) => {
            const title = $(el).find('.entry-title a').text().trim();
            const link = $(el).find('.entry-title a').attr('href');
            const thumbnail = $(el).find('.mh-posts-list-thumb img').attr('src');
            const category = $(el).find('.mh-image-caption').text().trim();

            results.push({ title, link, thumbnail, category });
        });

        res.json(results);
    } catch (error) {
        console.error('Error fetching trending data:', error);
        res.status(500).send('Failed to fetch trending data');
    }
});

app.get('/category/:name', async (req, res) => {
    const { name } = req.params;
    const url = `https://hentaix.io/category/${name}/`;

    try {
        const response = await fetch(url);
        const data = await response.text();
        const $ = cheerio.load(data);

        const categoryTitle = $('header.page-header .page-title').text().trim();
        const categoryDescription = $('header.page-header .entry-content').html().trim();
        const results = [];

        $('article.mh-posts-list-item').each((i, el) => {
            const title = $(el).find('.entry-title a').text().trim();
            const link = $(el).find('.entry-title a').attr('href');
            const thumbnail = $(el).find('.mh-posts-list-thumb img').attr('src');
            const category = $(el).find('.mh-image-caption').text().trim();

            results.push({ title, link, thumbnail, category });
        });

        res.json({ categoryTitle, categoryDescription, results });
    } catch (error) {
        console.error('Error fetching category data:', error);
        res.status(500).send('Failed to fetch category data');
    }
});

app.get('/uncensored', async (req, res) => {
    const urls = [
        'https://hentaix.io/uncensored/',
        'https://hentaix.io/uncensored/page/2/'
    ];

    try {
        const results = [];
        for (const url of urls) {
            const response = await fetch(url);
            const data = await response.text();
            const $ = cheerio.load(data);

            $('article.mh-posts-list-item').each((i, el) => {
                const title = $(el).find('.entry-title a').text().trim();
                const link = $(el).find('.entry-title a').attr('href');
                const thumbnail = $(el).find('.mh-posts-list-thumb img').attr('src');
                const category = $(el).find('.mh-image-caption').text().trim();

                results.push({ title, link, thumbnail, category });
            });
        }
        res.json(results);
    } catch (error) {
        console.error('Error fetching uncensored content:', error);
        res.status(500).send('Server error');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
