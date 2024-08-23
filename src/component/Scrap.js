import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Scrap.css';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Chip from '@mui/material/Chip';
import Multiselect from 'multiselect-react-dropdown';


const Scrap = () => {
  const location = useLocation();
  const { userName } = location.state || {};
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [searchText, setSearchText] = useState('');
  const [showData, setShowingData] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isComparing, setComparing] = useState(false);
  const [excludeSources, setExcludeSources] = useState([]);
  const [filteredSources, setFilteredSources] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [restoredData, setRestoredData] = useState(null);
  

  const [checkedItems, setCheckedItems] = useState({
    Amazon: false,
    Flipkart: false,
    Snapdeal: false,
    Dmart: false,
  });
  const navigate = useNavigate(); 

  
  useEffect(() => {
    const searchTerms = searchText.toLowerCase().split(' ');
  
    if (filteredSources) {
      const filtered = filteredSources.filter(item =>
        searchTerms.every(term =>
          Object.values(item).some(value =>
            typeof value === 'string' && value.toLowerCase().includes(term)
          )
        )
      );
      setRestoredData(filtered);
      setShowingData(filtered);
      setSortOrder('');
    }
    else if (data) {
      const filtered = data.filter(item =>
        searchTerms.every(term =>
          Object.values(item).some(value =>
            typeof value === 'string' && value.toLowerCase().includes(term)
          )
        )
      );
      setRestoredData(filtered);
      setShowingData(filtered);
      setSortOrder('');
    }
  }, [data, searchText]);
  

  useEffect(() => {
    console.log(selectedProducts);
  }, [selectedProducts]);

  useEffect(() => {
    if(data) {
    const filteredBySource = data.filter(item => !checkedItems[item.source]);
    setFilteredSources(filteredBySource);
    setRestoredData(filteredBySource);
    setShowingData(filteredBySource);
    setSortOrder('');
    }
  }, [data,checkedItems]);

  
  const handleSubmit = async (e, retryCount = 0) => {
    e.preventDefault();
    setSelectedIds([]);
    setSortOrder('');
    setSelectedProducts([]);
    setLoading(true);
    setError('');
    try {
      const cleanedSearchTerm = searchTerm.replace(/\s+/g, '');
      const response = await axios.get(`http://localhost:5000/api/get_product/scrape?url=${encodeURIComponent(searchTerm)}`);
      const responsedb = await axios.get(`http://localhost:5000/api/product/show?url=${encodeURIComponent(cleanedSearchTerm)}`);
      setData(responsedb.data.data);
      setShowingData(responsedb.data.data);
      setError('');
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Error fetching data', error);
      if (retryCount < 3) {
        console.log(`Retrying... Attempt ${retryCount + 1}`);
        handleSubmit(e, retryCount + 1);
      } else {
        console.error('Max retry attempts reached');
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchInputChange = (e) => {
    setSearchText(e.target.value);
  };

  const handleSort = (order) => {
    if (showData) {
      let sortedData = [...showData];
      if (order === 'lowToHigh') {
        sortedData.sort((a, b) => parseFloat(a.price.replace(/,/g, '')) - parseFloat(b.price.replace(/,/g, '')));
        setSortOrder('Low to High');
      } else if (order === 'highToLow') {
        sortedData.sort((a, b) => parseFloat(b.price.replace(/,/g, '')) - parseFloat(a.price.replace(/,/g, '')));
        setSortOrder('High to Low');
      }
      setShowingData(sortedData);
    }
  };
  

  const handleCompareClick = () => {
    const selectedProductsInfo = selectedProducts.map(product => ({ url: product.url, id: product.id }));
    const urlParams = new URLSearchParams();
    
    selectedProductsInfo.forEach(product => {
      urlParams.append('urls', product.url);
      urlParams.append('ids', product.id);
    });
  
    window.open(`/product_cmp?${urlParams.toString()}`, '_blank');
  };
  
  const handleDeleteSortChip = () => {
    setSortOrder('');
    setShowingData(restoredData); // Restore original data
  };

  const handleProductSelect = (item) => {
    if (selectedIds.includes(item.id)) {
        // If the item id is already in the list, remove it
        setSelectedIds((prevSelectedIds) => prevSelectedIds.filter(id => id !== item.id));
        setSelectedProducts((prevSelectedProducts) => prevSelectedProducts.filter(product => product.id !== item.id));
    } else if (selectedIds.length < 2) {
        // If the item id is not in the list and the limit is not reached, add it
        setSelectedIds((prevSelectedIds) => [...prevSelectedIds, item.id]);
        setSelectedProducts((prevSelectedProducts) => [...prevSelectedProducts, item]);
    }
};
const handleExclude = (selectedOptions) => {
  const values = Array.from(selectedOptions, option => option.value);
  setExcludeSources(values);
  // Perform any additional actions with the selected values
};
const handleExcludeSelect = (selectedList, selectedItem) => {
  setExcludeSources(selectedList.map(item => item.name));
};
const toggleDropdown = () => {
  setDropdownVisible(!dropdownVisible);
};
const handleCheckboxChange = (event) => {
  const { name, checked } = event.target;
  setCheckedItems((prevCheckedItems) => ({
    ...prevCheckedItems,
    [name]: checked,
  }));
};

const handleDelete = (item) => {
  setSelectedIds((prevSelectedIds) => prevSelectedIds.filter(id => id !== item.id));
  setSelectedProducts((prevSelectedProducts) => prevSelectedProducts.filter(product => product.id !== item.id));
};



  return (
    <div className='Main'>
      <h2>Welcome {userName} on Product Compare Platform</h2>
      
      <div>
        <div className="search-sort-container">
        {showData && (
        <div className="dropdown-container">
        <button className="dropdown-button" onClick={toggleDropdown}>
          Exclude Sources
        </button>
        <div className={`dropdown-list ${dropdownVisible ? 'show' : ''}`}>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="Amazon"
              checked={checkedItems.Amazon}
              onChange={handleCheckboxChange}
            />
            Amazon
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="Flipkart"
              checked={checkedItems.Flipkart}
              onChange={handleCheckboxChange}
            />
            Flipkart
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="Snapdeal"
              checked={checkedItems.Snapdeal}
              onChange={handleCheckboxChange}
            />
            Snapdeal
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="Dmart"
              checked={checkedItems.Dmart}
              onChange={handleCheckboxChange}
            />
            D-Mart
          </label>
        </div>
      </div>
      )}
          {showData && (
            <div className="search-container">
              <input
                type="text"
                value={searchText}
                onChange={handleSearchInputChange}
                placeholder="Search here"
                required
              />
            </div>
          )}
          <form onSubmit={handleSubmit} className='search_input'>
            <input
              type="text"
              value={searchTerm}
              onChange={handleInputChange}
              placeholder="Enter search term"
              required
            />
            <button type="submit" className="submit-button" disabled={isLoading}>
              {isLoading ? 'Processing please wait...' : 'Submit'}
            </button>
          </form>
          {showData && (
            <div className="sort-container">
              <select onChange={(e) => handleSort(e.target.value)} value={sortOrder}>
                <option value="">Sort by Price</option>
                <option value="lowToHigh">Price: Low to High</option>
                <option value="highToLow">Price: High to Low</option>
              </select>
            </div>
          )}
          {showData && (
            <div className="button-container">
              <button
                type="button"
                className="compare-button"
                onClick={handleCompareClick}
                disabled={isLoading || selectedProducts.length !== 2}
              >
                Click to compare
              </button> 
            </div>
          )}
        </div>
      </div>
      {isLoading && <p>Seems like you have entered new product name. It will take a minute to process.</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {selectedProducts.length > 0 && (
        <div className="selected-products">
          {selectedProducts.map((product, index) => (
            <Chip
              key={index}
              label={
                <span>
                  {product.source+' : '+product.title}
                </span>
              }
              onDelete={() => handleDelete(product)}
            />
          ))}
        </div>
      )}
      {sortOrder && (
            <Chip
              label={`Sort Order: ${sortOrder}`}
              onDelete={handleDeleteSortChip}
            />
          )}
      {showData && (
        <div className="scroll-container">
          <div className="product-grid">
            {showData.map((item, index) => (
              item.title && (
                <div
                  key={index}
                  onClick={() => handleProductSelect(item)}
                  className={`product-card ${selectedIds.includes(item.id) ? 'selected' : ''}`}
                >
                  {selectedIds.includes(item.id) && (
                    <div className="tick-mark">✔</div>
                  )}
                  <h4>{item.title}</h4>
                  <p>Source: {item.source}</p>
                  <p>Price: ₹{item.price}</p>
                  <p>Original Price: {item.original}</p>
                  <p>Rating: {item.rating}</p>
                  <p>Total Raters: {item.totalRaters}</p>
                  <p>Discount: {item.discount}</p>
                  <p>
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      View Product
                    </a>
                  </p>
                  {item.image && <img src={item.image} height={'200px'} alt={`Product ${index + 1}`} />}
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Scrap;
