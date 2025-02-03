import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaKeyboard } from 'react-icons/fa';
import { BiJoystickButton } from 'react-icons/bi';

const SelectControl = () => {
    const navigate = useNavigate();

    const getStoredControl = () => {
      const storedData = localStorage.getItem('selectedControl');
      const storedTime = localStorage.getItem('selectedControlTime');

      // Check if the stored time exists and if it's expired
      if (storedData && storedTime) {
          const currentTime = new Date().getTime();
          const expirationTime = parseInt(storedTime, 10) + 2 * 60 * 60 * 1000; // 2 hours in milliseconds

          if (currentTime < expirationTime) {
              return storedData; // Return the stored value if not expired
          } else {
              localStorage.removeItem('selectedControl'); // Remove expired item
              localStorage.removeItem('selectedControlTime'); // Remove expired timestamp
          }
      }
      return 'PC'; // Default value if nothing is stored or expired
    };

    const [activeButton, setActiveButton] = useState(getStoredControl);

    const handleClick = (button) => {
      setActiveButton(button); // Change active button
      localStorage.setItem('selectedControl', button); // Save the selection in local storage
      localStorage.setItem('selectedControlTime', new Date().getTime()); // Save the current time
    };

    useEffect(() => {
      // Update the active button from local storage on component mount
      const storedControl = localStorage.getItem('selectedControl');
      if (storedControl) {
          setActiveButton(storedControl);
      }
    }, []);

    const handleBack = () => navigate("/");

  return (
    <div className="background w-100 d-flex align-items-center justify-content-center">
    <Container>
    <Row className="justify-content-center">
    <h2 className="title text-center">Device Control Selection</h2>
      <Col xs={12} md={8} lg={6} className="d-flex justify-content-center">
        <Card style={{ width: '100%' }} className="mb-2 bg-light">
          <Card.Body className="d-flex justify-content-center align-items-center">
          <div className="button-wrapper">
            <Button
             variant={activeButton === 'PC' ? 'success' : 'outline-success'}
             className="icon-button button-width"
             onClick={() => handleClick('PC')}
            >
                <FaKeyboard className="button-icon button-width" />
                <span className="button-text">PC</span>
            </Button>
            </div>

            <div className="button-wrapper">
            <Button
             variant={activeButton === 'Phone' ? 'success' : 'outline-success'}
             className="icon-button button-width"
             onClick={() => handleClick('Phone')}
            >
                <BiJoystickButton className="button-icon" />
                <span className="button-text">Phone</span>
          </Button>
          </div>
          </Card.Body>
          <Card.Footer>
          <Button variant="secondary" className="back-button" onClick={handleBack}>Back</Button>
          </Card.Footer>
        </Card>
      </Col>
    </Row>
    <Row className="justify-content-center">
      <Col xs={12} md={8} lg={6} className="d-flex justify-content-center">
        <span className="info text-center">
          Note: Go to "How To Play" in Main Menu to see Game Instructions.
        </span>
      </Col>
    </Row>
    </Container>
    </div>
  )
};

export default SelectControl;