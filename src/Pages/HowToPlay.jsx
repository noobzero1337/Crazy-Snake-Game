import { Container, Row, Col, Card, Button, Image } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown, faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import fruit from "../assets/img/fruit.png";
import potionScore from "../assets/img/potionScore.png";

const HowToPlay = () => {
    const navigate = useNavigate();

    const handleBack = () => navigate("/");

  return (
    <div className="background w-100 d-flex align-items-center justify-content-center">
    <Container>
    <Row className="justify-content-center">
    <h2 className="title text-center">Game Instruction</h2>
      <Col xs={12} md={8} lg={8} className="d-flex justify-content-center">
        <Card style={{ width: '100%' }} className="mb-2 bg-light">
          <Card.Body>
            <Card.Title>
            <h4>PC Controls : </h4>
              <ul>
                <li>Move Snake = Up , Left , Right , Down </li>
                <li>Pause The Game = Space </li>
              </ul>
            <h4>Phone Controls : </h4>
              <ul>
                <li>
                Move Snake = <Button variant="primary" disabled>
                  <FontAwesomeIcon icon={faArrowUp} />
                </Button> <Button variant="primary" disabled>
                  <FontAwesomeIcon icon={faArrowLeft} />
                </Button> <Button variant="primary" disabled>
                  <FontAwesomeIcon icon={faArrowRight} />
                </Button> <Button variant="primary" disabled>
                  <FontAwesomeIcon icon={faArrowDown} />
                </Button>
                </li>
                <li>Pause The Game = Tap the snake field in-game</li>
              </ul>
            <h4>Objects : </h4>
              <ul>
                <li>
                <Image 
                  src={fruit} 
                  alt="fruit-img" 
                  className="center food-image" 
                  loading="lazy"
                /> 
                  = Food
                </li>
                <li>
                <Image 
                  src={potionScore} 
                  alt="potionScore-img" 
                  className="center food-image" 
                  loading="lazy"
                />
                  = x3 Score Potion
                </li>
              </ul>
            </Card.Title>
          </Card.Body>
          <Card.Footer>
          <Button variant="secondary" className="back-button" onClick={handleBack}>Back</Button>
          </Card.Footer>
        </Card>
      </Col>
    </Row>
    </Container>
    </div>
  );
};

export default HowToPlay;