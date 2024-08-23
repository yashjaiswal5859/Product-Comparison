// src/Home.jsx
import React, { useState } from 'react';
import EmailForm from './EmailForm';
import EmailSent from './EmailSent';
import Register from './Register';
import './Reg_Login.css'
import Login from './Login';

const Reg_Login = () => {
  const [emailSent, setEmailSent] = useState(false);

    const [check, setCheck] = useState(0); // 0 for register, 1 for login
    const handleClick = () => {
        setCheck(check === 0 ? 1 : 0); // Toggle between 0 and 1
      };
      return (
    //     <div className="Home">
    //   <h1>Send Email</h1>
    //   {emailSent ? <EmailSent /> : <EmailForm setEmailSent={setEmailSent} />}
    // </div>
        <div className="home-container">
          <h4 className="home-title">
            {check === 0 ? (
              <>
                Already having account?{' '}
                <span className="link" onClick={handleClick}>
                  Click Here
                </span>
              </>
            ) : (
              <>
                Not having account?{' '}
                <span className="link" onClick={handleClick}>
                  Click Here
                </span>
              </>
            )}
          </h4>
          <div className={`form-container ${check === 1 ? 'flip' : ''}`}>
            <div className="form-content">
              {check === 0 ? <Register /> : <Login />}
            </div>
          </div>
        </div>
      );
    };
    
    export default Reg_Login;
//   return (
//     <div className="home-container">
//       <h4 className="home-title">
//         {check === 0 ? (
//           <>
//             Already having account?{' '}
//             <span className="link" onClick={handleClick}>
//               Click Here
//             </span>
//           </>
//         ) : (
//           <>
//             Not having account?{' '}
//             <span className="link" onClick={handleClick}>
//               Click Here
//             </span>
//           </>
//         )}
//       </h4>
//       {check === 0 ? <Register /> : <Login />}
//       {/* <h1>Send Email</h1>
//       {emailSent ? <EmailSent /> : <EmailForm setEmailSent={setEmailSent} />} */}
//     </div>
//   );
// };

// export default Home;
