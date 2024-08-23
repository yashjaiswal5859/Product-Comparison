const express = require('express');
const router = express.Router();
const Product = require('../model/Product'); // Ensure the correct path
const axios = require('axios');
const cheerio = require('cheerio');
const { Mutex } = require('async-mutex');

const mutex = new Mutex();
let count=0;

async function callPythonScraper(searchTerm) {
    try {
        const response = await axios.get('http://127.0.0.1:5000/scrape_Flipkart', {
            params: {
                search_term: searchTerm
            }
        });
        console.log('Scraped data:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error calling Python scraper:', error);
        throw error;
    }
}


// Route to handle scraping requests
router.get('/scrape', async (req, res) => {
    
    const { url } = req.query;
    const cleanedSearchTerm = url.replace(/\s+/g, '');
    
    if (!url) {
        return res.status(400).json({ error: 'URL parameter is required' });
    }
    const amazonUrl = 'https://www.amazon.in/s?k='+url+'&page=';
    const amazonDivClass = '.s-card-container';
    try {
     callPythonScraper(url);
    }
    catch {
        console.log('Error with python');
    }
    try {
        const existingProduct = await Product.findById(cleanedSearchTerm);
    
    if (existingProduct && existingProduct.amazon) {
      return res.status(200).json({ message: 'Data already present with amazon=true',data:existingProduct.products});
    }
        const scrapeAmazonPromise = scrap(amazonUrl, amazonDivClass, cleanedSearchTerm);
        const [scrapedData] = await Promise.all([scrapeAmazonPromise]);

      
      const updatedProduct = await Product.findById(cleanedSearchTerm);
      res.status(200).json({ message: 'Data scraped and stored successfully', data: updatedProduct.products });
    } catch (error) {
      console.error('Error scraping data:', error);
      res.status(500).json({ error: 'Error scraping data' });
    }
  });
  
async function getData(url,divClass,cleanedSearchTerm)
{
    console.log(url);
    const data=[];
    try {
        let failure=true;
        let response;
        while(failure) {
            try {
            response = await axios.get(url, { timeout: 10000 });
            failure=false;
            }
            catch(err) {
            }
        }
        const $ = cheerio.load(response.data);
        const elements = $(divClass);
        if (elements.length === 0) {
            console.log(`No more elements found on page . Stopping.`);
            return false;
        }
        elements.each((i, elem) => {
            const price1 = $(elem).find('.a-price-whole').text().trim().replace('₹', '');
            if (price1) {
            const elementData = {
            source: 'Amazon',
            title: $(elem).find('h2 a span').text().trim(),
            url: 'https://www.amazon.in'+$(elem).find('h2 a').attr('href'),
            bought : $(elem).find('div.a-row.a-size-base > span.a-size-base.a-color-secondary').text().trim(),
            price: $(elem).find('.a-price-whole').text().trim().replace('₹', ''),
            original : $(elem).find('span.a-price.a-text-price span.a-offscreen').text().trim(),
            rating: $(elem).find('i.a-icon-star-small span.a-icon-alt').text().trim(),
            totalRaters: $(elem).find('.a-size-base.s-underline-text').text().trim(),
            image: $(elem).find('img.s-image').attr('src'),
            discount : $(elem).find('.a-row.a-size-base.a-color-base span').last().text().trim(),
            additionalOffer : $(elem).find('span.s-coupon-unclipped').text().trim(),
            id : 'A'+count,
            };
            data.push(elementData);
            count+=1;
        }
        });
        await Product.updateOne(
            { _id: cleanedSearchTerm },
            { $push: { products: { $each: data } }, $set: { amazon: true } },
            { upsert: true }
          );
        } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        }
    return true;
}
// Function to scrape data from a URL
async function scrap(url, divClass, cleanedSearchTerm) {
    let i = 1;
    while (true) {
        const success = await getData(url + i, divClass, cleanedSearchTerm);
        if (success) {
            i++;
        } else {
            break;
        }
    }
}

router.get('/cmp_scrape', async (req, res) => {
    const url = req.query.url;
    const id = req.query.id;
    if(id[0]==='F' || id[0]==='D') {
        const response = await axios.get('http://127.0.0.1:5000/scrape_c', {
            params: {
                url : url,
            }
        });
        const htmlContent = response.data;
  
      res.json({ content: htmlContent });
      return;
    }
    try {
        let response;
        while(true) 
        {
            try 
            {
                response = await axios.get(url, { timeout: 10000 });
                
                break
            }
            catch (err)
            {
            }
        }
      const htmlContent = {data : response.data};
  
      res.json({ content: htmlContent });
    } catch (error) {
      console.error('Error scraping URL:', error);
      res.status(500).json({ error: 'Failed to scrape the URL' });
    }
  });
module.exports = router;
