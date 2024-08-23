import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient
from flask import Flask, request, jsonify
import concurrent.futures
import multiprocessing
import time
import threading

app = Flask(__name__)
lock = threading.Lock()

class SnapdealScraper:
    def __init__(self, name):
        self.search_term = name
        self.url = f'https://www.snapdeal.com/search?keyword={name}&sort=rlvncy'
        self.prefix = 'https://www.snapdeal.com'
        self.cleaned_search=self.search_term.replace(' ','')
        self.__products = []
        self.soup=None

    def getList(self):
        return self.__products

    def checkExistingData(self):
        client = MongoClient('mongodb://localhost:27017/')
        db = client['Product_app']
        collection = db['products']

        existing_product = collection.find_one({'_id': self.cleaned_search, 'snapdeal': True})
        if existing_product:
            print(f"Data already present for search term '{self.search_term}' with snapdeal=True. Skipping scraping.")
            return True
        return False

    def scrap_1(self,soup):
        divs=soup.find_all("div", class_="col-xs-6 favDp product-tuple-listing js-tuple")
        count=0
        for div in divs:
            product = {}
            price_div = div.find('span', class_='lfloat product-price')
            product['price'] = price_div.text.strip() if price_div else None
            if product['price'] and product['price'].startswith('Rs.'):
                product['price'] = product['price'][3:].strip()
            
            product['source'] = 'Snapdeal'
            
            title_div = div.find('p', class_='product-title')
            product['title'] = title_div.text.strip() if title_div else None
            
            image_div = div.find('img', class_='product-image')
            try:
                product['image'] = image_div['src'] if image_div else None
            except: 
                product['image'] = image_div['data-src'] if image_div else None
    
            url_div = div.find('a', class_='dp-widget-link')
            product['url'] = url_div['href'] if url_div else None
            
            original_price_div = div.find('span', class_='lfloat product-desc-price strike')
            product['original'] = original_price_div.text.strip() if original_price_div else None
            
            discount_div = div.find('div', class_='product-discount')
            product['discount'] = discount_div.text.strip() if discount_div else None
            product['id']='S'+str(count)
            count+=1
            self.__products.append(product)
    
    def getRequest(self):
        if self.checkExistingData():
            return

        max_retries = 3
        for attempt in range(max_retries):
            try:
                r = requests.get(self.url)
                r.raise_for_status()  # Raises an HTTPError if the HTTP request returned an unsuccessful status code
                self.soup = BeautifulSoup(r.text, "html.parser")
                break  # Exit the retry loop if the request is successful
            except requests.exceptions.RequestException as e:
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    return  # Exit the method if all retries fail

    def scrap(self):
        if self.soup==None:
            return
        try:
            self.scrap_1(self.soup)
        except Exception as e:
            print(f"Error fetching page : {str(e)}")

        # Store scraped data in MongoDB
        
    def storeInMongoDB(self):
        client = MongoClient('mongodb://localhost:27017/')
        db = client['Product_app']
        collection = db['products']

        existing_product = collection.find_one({'_id': self.cleaned_search})

        if existing_product:
            if existing_product.get('snapdeal', False):
                print(f"Data already present for search term '{self.search_term}' with snapdeal=True. Skipping.")
                return
            else:
                print(f"Appending data to existing document with _id '{self.search_term}' and setting snapdeal=True")
                # Append new products to the existing 'products' array in the document
                collection.update_one(
                    {'_id': self.cleaned_search},
                    {'$push': {'products': {'$each': self.__products}},
                     '$set': {'snapdeal': True}},
                )
        else:
            print(f"Inserting new document with _id '{self.search_term}' and snapdeal=True")
            # Insert new document if no existing document is found
            document = {
                '_id': self.cleaned_search,
                'snapdeal': True,
                'products': self.__products
            }
            collection.insert_one(document)

        print(f"Inserted {len(self.__products)} products into MongoDB for search term '{self.search_term}'")

class DmartScraper:
    def __init__(self, name):
        self.search_term = name
        self.url = f'https://digital.dmart.in/api/v2/search/{name}'
        self.prefix = 'https://www.dmart.in/product/'
        self.img='https://cdn.dmart.in/images/products/'
        self.cleaned_search=self.search_term.replace(' ','')
        self.__products = []
        self.soup=None

    def getList(self):
        return self.__products

    def checkExistingData(self):
        client = MongoClient('mongodb://localhost:27017/')
        db = client['Product_app']
        collection = db['products']
        existing_product = collection.find_one({'_id': self.cleaned_search, 'dmart': True})
        if existing_product:
            print(f"Data already present for search term '{self.search_term}' with dmart=True. Skipping scraping.")
            return True
        return False
    def scrap_1(self,data):
        #print(data['products'][0])
        count=0
        for i in data['products']:
            if(i['buyable']!='true'):
                continue
            product={}
            product['source']='Dmart'
            product['url']=self.prefix+i['seo_token_ntk']
            for j in i['sKUs']:
                if(j['defaultVariant']=='N'):
                    continue
                product['title']=j['name']
                product['price']=j['priceSALE']
                product['original']='₹'+j['priceMRP']
                product['discount']=str(j['savingPercentage'])+'%'
                product['image']=self.img+j['productImageKey']+'_5_B.jpg'
                break
            product['id']='D'+str(count)
            count+=1
            self.__products.append(product)

    def getRequest(self):
        if self.checkExistingData():
            return

        max_retries = 3
        for attempt in range(max_retries):
            try:
                r = requests.get(self.url)
                r.raise_for_status()  # Raises an HTTPError if the HTTP request returned an unsuccessful status code
                self.soup = r.json()
                break  # Exit the retry loop if the request is successful
            except requests.exceptions.RequestException as e:
                if attempt < max_retries - 1:
                    time.sleep(2 ** attempt)  # Exponential backoff
                else:
                    return
    def scrap(self):
        if(self.soup==None):
            return
        try:    
            self.scrap_1(self.soup)
        except Exception as e:
            print(f"Error fetching page : {str(e)}")

        # Store scraped data in MongoDB
        # with lock:
        #     self.storeInMongoDB()
    def storeInMongoDB(self):
        client = MongoClient('mongodb://localhost:27017/')
        db = client['Product_app']
        collection = db['products']
        existing_product = collection.find_one({'_id': self.cleaned_search})

        if existing_product:
            if existing_product.get('dmart', False):
                print(f"Data already present for search term '{self.search_term}' with dmart=True. Skipping.")
                return
            else:
                print(f"Appending data to existing document with _id '{self.search_term}' and setting dmart=True")
                # Append new products to the existing 'products' array in the document
                collection.update_one(
                    {'_id': self.cleaned_search},
                    {'$push': {'products': {'$each': self.__products}},
                     '$set': {'dmart': True}},
                )
        else:
            print(f"Inserting new document with _id '{self.search_term}' and dmart=True")
            # Insert new document if no existing document is found
            document = {
                '_id': self.cleaned_search,
                'dmart': True,
                'products': self.__products
            }
            collection.insert_one(document)

        print(f"Inserted {len(self.__products)} products into MongoDB for search term '{self.search_term}'")

class FlipkartScraper:
    def __init__(self, name):
        self.search_term = name
        self.url = f'https://www.flipkart.com/search?q={name}&page='
        self.prefix = 'https://www.flipkart.com'
        self.cleaned_search=self.search_term.replace(' ','')
        self.__products = []
        self.soup=[]
        self.count=0
    def getList(self):
        return self.__products

    def checkExistingData(self):
        client = MongoClient('mongodb://localhost:27017/')
        db = client['Product_app']
        collection = db['products']

        existing_product = collection.find_one({'_id': self.cleaned_search, 'flipkart': True})
        if existing_product:
            print(f"Data already present for search term '{self.search_term}' with flipkart=True. Skipping scraping.")
            return True
        return False

    def scrap_1(self,soup):
                divs = soup.find_all("div", class_="tUxRFH")
                for div in divs:
                    product = {}
                    price_div = div.find('div', class_='Nx9bqj _4b5DiR')
                    product['price'] = price_div.text.strip() if price_div else None
                    if(product['price'] and product['price'][0]=='₹'):
                        product['price']=product['price'][1::]
                    if(product['price']==None):
                        continue
                    product['source'] = 'Flipkart'
                    title_div=div.find('div', class_='KzDlHZ')
                    product['title'] = title_div.text.strip() if title_div else None
                    image_div=div.find('img', class_='DByuf4')
                    product['image'] = image_div['src'] if image_div else None
                    url_div=div.find('a', class_='CGtC98')
                    product['url'] = self.prefix + url_div['href'] if url_div else ''
                    rating_div = div.find('div', class_='XQDdHH')
                    product['rating'] = rating_div.text.strip() if rating_div else None
                    ratings_info = div.find('span', class_='Wphh3N')
                    if ratings_info:
                        ratings_text = ratings_info.text.strip()
                        product['totalRaters'] = ratings_text.split(' ')[0]
                    else:
                        product['totalRaters'] = None
                    original_price_div = div.find('div', class_='yRaY8j ZYYwLA')
                    product['original'] = original_price_div.text.strip() if original_price_div else None
                    discount_div = div.find('div', class_='UkUFwK')
                    product['discount'] = discount_div.text.strip() if discount_div else None
                    product['id']='F'+str(self.count)
                    self.count+=1
                    self.__products.append(product)
    def scrap_2(self, soup):
        divs = soup.find_all("div", class_="slAVV4")
        for div in divs:
            product = {}
            price_div = div.find('div', class_='Nx9bqj')
            product['price'] = price_div.text.strip() if price_div else None
            if product['price'] and product['price'][0] == '₹':
                product['price'] = product['price'][1:]
            if(product['price']==None):
                continue
            original_price_div = div.find('div', class_='yRaY8j')
            product['original'] = original_price_div.text.strip() if original_price_div else None
            product['source'] = 'Flipkart'            
            title_div = div.find('a', class_='wjcEIp')
            product['title'] = title_div['title']
            title_div = div.find("div", class_="NqpwHC")
            product['title'] += ' '+title_div.text.strip() if title_div else ''
            image_tag = div.find('img', class_='DByuf4')
            product['image'] = image_tag['src'] if image_tag else None            
            url_tag = div.find('a', class_='wjcEIp')
            product['url'] = self.prefix + url_tag['href'] if url_tag else None            
            rating_div = div.find('div', class_='XQDdHH')
            product['rating'] = rating_div.text.strip() if rating_div else None            
            ratings_info = div.find('span', class_='Wphh3N')
            if ratings_info:
                ratings_text = ratings_info.text.strip()
                product['totalRaters'] = ratings_text.split(' ')[0]
            else:
                product['totalRaters'] = None            
            discount_div = div.find('div', class_='UkUFwK')
            product['discount'] = discount_div.text.strip() if discount_div else None
            product['id']='D'+str(self.count)
            self.count+=1
            self.__products.append(product)
    def scrap_3(self,soup):
        divs = soup.find_all("div", class_="_1sdMkc LFEi7Z")
        for div in divs:
            product = {}
            price_div = div.find('div', class_='Nx9bqj')
            product['price'] = price_div.text.strip() if price_div else None
            if product['price'] and product['price'][0] == '₹':
                product['price'] = product['price'][1:]
            if product['price'] is None:
                continue
            # Extract original price
            original_price_div = div.find('div', class_='Nx9bqj')
            product['original'] = original_price_div.text.strip() if original_price_div else None
            # Source
            product['source'] = 'Flipkart'
            # Extract title
            title_div = div.find('a', class_='WKTcLC BwBZTg')
            product['title'] = title_div['title'] if title_div else None
            # Extract image URL
            image_tag = div.find('img', class_='_53J4C-')
            product['image'] = image_tag['src'] if image_tag else None
            
            # Extract product URL
            url_tag = div.find('a', class_='WKTcLC BwBZTg')
            product['url'] = self.prefix+url_tag['href'] if url_tag else None
            
            # Extract rating
            product['rating'] =  None
            
            # Extract total raters
            product['totalRaters'] = None
            
            # Extract discount
            discount_div = None
            product['discount'] = None
            product['id']='D'+str(self.count)
            self.count+=1
            self.__products.append(product)
    
    def getRequest(self):
        if self.checkExistingData():
            return

        max_retries = 3
        i = 1

        while True:
            for attempt in range(max_retries):
                try:
                    r = requests.get(self.url + str(i))
                    r.raise_for_status()  # Raises an HTTPError if the HTTP request returned an unsuccessful status code
                    soup = BeautifulSoup(r.text, "html.parser")
                    
                    if soup.find(class_='tUxRFH') or soup.find(class_='slAVV4') or soup.find(class_='_1sdMkc LFEi7Z'):
                        self.soup.append(soup)
                        i += 1
                    else:
                        return  # Exit the method if no more relevant data is found

                    break  # Exit the retry loop if the request is successful

                except requests.exceptions.RequestException as e:
                    if attempt < max_retries - 1:
                        time.sleep(2 ** attempt)  # Exponential backoff
                    else:
                        return  # Exit the method if all retries fail

    def scrap(self):
        if self.soup==[]:
            return
        i=0
        for soup in self.soup:
            try:
                if(soup.find(class_='tUxRFH')):
                    self.scrap_1(soup)
                elif(soup.find(class_='slAVV4')):
                    self.scrap_2(soup)
                elif(soup.find(class_='_1sdMkc LFEi7Z')):
                    self.scrap_3(soup)
                i+=1
            except Exception as e:
                print(f"Error fetching page : {str(e)}")
        print(f'Fetched {i} pages')
        # Store scraped data in MongoDB
        # with lock:
        #     self.storeInMongoDB()

    def storeInMongoDB(self):
        client = MongoClient('mongodb://localhost:27017/')
        db = client['Product_app']
        collection = db['products']

        existing_product = collection.find_one({'_id': self.cleaned_search})

        if existing_product:
            if existing_product.get('flipkart', False):
                print(f"Data already present for search term '{self.search_term}' with flipkart=True. Skipping.")
                return
            else:
                print(f"Appending data to existing document with _id '{self.search_term}' and setting flipkart=True")
                # Append new products to the existing 'products' array in the document
                collection.update_one(
                    {'_id': self.cleaned_search},
                    {'$push': {'products': {'$each': self.__products}},
                     '$set': {'flipkart': True}},
                )
        else:
            print(f"Inserting new document with _id '{self.search_term}' and flipkart=True")
            # Insert new document if no existing document is found
            document = {
                '_id': self.cleaned_search,
                'flipkart': True,
                'products': self.__products
            }
            collection.insert_one(document)

        print(f"Inserted {len(self.__products)} products into MongoDB for search term '{self.search_term}'")


@app.route('/scrape_Flipkart', methods=['GET'])
def scrape():
    search_term = request.args.get('search_term')
    if not search_term:
        return jsonify({"error": "search_term parameter is required"}), 400
    with lock:
        flipkart = FlipkartScraper(search_term)
        flipkart.getRequest()
        dmart = DmartScraper(search_term)
        dmart.getRequest()
        snapdeal = SnapdealScraper(search_term)
        snapdeal.getRequest()
    threads = []
    threads.append(threading.Thread(target=flipkart.scrap))
    threads.append(threading.Thread(target=dmart.scrap))
    threads.append(threading.Thread(target=snapdeal.scrap))
    for thread in threads:
        thread.start()
    
    # Wait for all threads to complete
    for thread in threads:
        thread.join()
    flipkart.storeInMongoDB()
    snapdeal.storeInMongoDB()
    dmart.storeInMongoDB()
    
    return jsonify({"message": "Scraping completed"}), 200

@app.route('/scrape_c',methods=['GET'])
def scrape_c():
    max_retries = 3
    while(max_retries>0):
        try:
            url=request.args.get('url')
            print(url)
            r = requests.get(url)
            print(r)
            r.raise_for_status()
            break
        except:
            max_retries-=1
    data=r.text
    print('///fk-cp-zion/css/Product.chunk.bde23f.css' in data)
    data=data.replace('"//static-assets-web.flixcart.com','"https://static-assets-web.flixcart.com')
    data=data.replace('///','https://static-assets-web.flixcart.com/fk-p-linchpin-web//')
    
    print('///fk-cp-zion/css/Product.chunk.bde23f.css' in data)
    
    return jsonify({"message": "Scraping_c completed","data" : data}), 200
def run_method(obj, method_name):
    method = getattr(obj, method_name)
    return method()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
