import { Modal, Button } from 'react-bootstrap';

const LoseModal = ({ show, score, onPlayAgain, onMainMenu }) => {
  return (
  <Modal 
   show={show} 
   onHide={onPlayAgain} 
   backdrop="static"
   keyboard={false}
   centered
  >
    <Modal.Header>
      <Modal.Title>
        <h2 className="lose">Game Over</h2>
      </Modal.Title>
    </Modal.Header>
    <Modal.Body className="text-center">
      <strong>Your score is {score}</strong>
    </Modal.Body>
    <Button variant="primary" onClick={onPlayAgain} className="play-again-button">Play Again</Button>
    <Button variant="danger" onClick={onMainMenu} className="main-menu-button">Main Menu</Button>
  </Modal>
  );
}

export default LoseModal;