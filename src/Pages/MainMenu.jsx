import { useEffect } from "react";
import { Container, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const MainMenu = () => {
    const navigate = useNavigate();

    const handlePlay = () => navigate("/game");
    const handleHowToPlay = () => navigate("/how2play");
    const handleSelectControl = () => navigate("/controlselect");

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

  useEffect(() => {
      const activeControl = getStoredControl(); // Get the stored control
      console.log("Active Control:", activeControl); // Log the active control
  }, []);

  return (
    <div className="background">
    <Container className="text-center">
      <h1 className="title">CRAZY SNAKE</h1>
      <div className="button-group">
        <Button className="menu-button" variant="success" onClick={handlePlay}>
          Play
        </Button>
        <Button className="menu-button" variant="success" onClick={handleHowToPlay}>
          How to Play
        </Button>
        <Button className="menu-button" variant="success" onClick={handleSelectControl}>
          Control Selection
        </Button>
      </div>
    </Container>
    </div>
  );
};

export default MainMenu;