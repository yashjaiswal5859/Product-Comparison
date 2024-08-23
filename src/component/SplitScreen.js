// SplitScreen.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const SplitScreen = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const urls = searchParams.getAll('urls');
  const ids = searchParams.getAll('ids');
  const [content1, setContent1] = useState('');
  const [content2, setContent2] = useState('');
  let check=0;
  useEffect(() => {
    const fetchContent = async (url, id, setContent) => {
      try {
        const response = await axios.get(`http://localhost:5000/api/get_product/cmp_scrape`, {
          params: {
            url,
            id
          }
        });        // Check if the response contains valid content
        if (response.data ) {
            const data=response.data.content;
            console.log(data.data);
            setContent(data.data);
        } else {
          throw new Error('Invalid content received');
        }
      } catch (error) {
        console.error('Error fetching content:', error);
        setContent(error);
      }
    };
    if (urls.length === 2) {
      if((check&1)==0) {
        fetchContent(urls[0],ids[0], setContent1);
        check=check|1;
      }
      if((check&2)==0) {
        fetchContent(urls[1],ids[1], setContent2);
        check=check|2;
      }
    }
  }, []);

  return (
    <div style={{ height: '140vh', backgroundColor: 'white', color: 'black', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px', textAlign: 'center', marginBottom: '20px' }}>
        <div style={{
          padding: '20px',
          backgroundColor: '#333',
          color: '#fff',
          borderRadius: '10px',
          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '18px', fontWeight: 'bold', margin: '0' }}>
            This page is only for view. Buttons and links will not work.
            <br />
            And if you encountered any error, kindly please refresh the page.<br />Currently Dmart is not working.
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', flex: 1 }}>
        <div style={{ flex: 1, padding: '3px', borderRight: '1px solid black', overflow: 'hidden' }}>
          <iframe
            // srcDoc={content1}
            srcDoc={content1}
            style={{ width: '100%', height: '100%', border: 'none', overflow: 'hidden' }}
            title="Page 1"
          />
        </div>
        <div style={{ flex: 1, padding: '3px', overflow: 'hidden' }}>
          <iframe
            srcDoc={content2}
            style={{ width: '100%', height: '100%', border: 'none', overflow: 'hidden' }}
            title="Page 2"
          />
        </div>
      </div>
    </div>
  );
        
};

export default SplitScreen;
