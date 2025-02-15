import { useState, useEffect, useRef, useReducer } from "react";
import { Container, Button, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import DOMPurify from "dompurify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown, faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import LoseModal from "../Components/LoseModal";
import fruit from "../assets/img/fruit.png";
import potionScore from "../assets/img/potionScore.png";

// Initial state for the game
const initialGameState = {
  apple: null,
  direction: "RIGHT",
  gameOver: false,
  score: 0,
  speed: 200,
  x3Active: false,
  showX3Message: false,
  potionStarted: false,
  paused: false,
  cooldown: false,
  potion: null,
};

// Reducer function to manage game state
const gameReducer = (state, action) => {
  switch (action.type) {
    case 'SET_APPLE':
      return { ...state, apple: action.payload };
    case 'SET_DIRECTION':
      return { ...state, direction: action.payload };
    case 'SET_GAME_OVER':
      return { ...state, gameOver: action.payload };
    case 'SET_SCORE':
      return { ...state, score: action.payload };
    case 'SET_SPEED':
      return { ...state, speed: action.payload };
    case 'SET_X3_ACTIVE':
      return { ...state, x3Active: action.payload };
    case 'SET_SHOW_X3_MESSAGE':
      return { ...state, showX3Message: action.payload };
    case 'SET_POTION_STARTED':
      return { ...state, potionStarted: action.payload };
    case 'SET_PAUSED':
      return { ...state, paused: action.payload };
    case 'SET_COOLDOWN':
      return { ...state, cooldown: action.payload };
    case 'SET_POTION':
      return { ...state, potion: action.payload };
    default:
      return state;
  }
};

const Game = () => {
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

  const SQUARE_SIZE = 20; // Size of each square
  const SEGMENT_SIZE = SQUARE_SIZE - 1;
  const navigate = useNavigate();

  // Use useReducer for game state
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);

  // Use useState for other variables
  const [boardWidth, setBoardWidth] = useState(1120); // Default width
  const [boardHeight, setBoardHeight] = useState(400); // Default height
  const [snake, setSnake] = useState([]);
  const [fruitImg, setFruitImg] = useState(null);
  const [potionImg, setPotionImg] = useState(null);
  const [controlType, setControlType] = useState(getStoredControl);

  const potionIntervalTimer = useRef(null);
  const potionDisappearTimer = useRef(null);
  const hideMessageTimer = useRef(null);
  const deactivateMultiplierTimer = useRef(null);
  const pausedRef = useRef(gameState.paused);
  const gameOverRef = useRef(gameState.gameOver);
  const intervalRef = useRef(null); // Store the game loop interval ID
  
  // Function to generate a random snake position and valid direction
  function generateRandomSnake() {
    const margin = 2; // Margin in number of squares to keep away from the border
    const effectiveWidth = boardWidth - margin * SQUARE_SIZE * 2;
    const effectiveHeight = boardHeight - margin * SQUARE_SIZE * 2;
  
    const headX =
      Math.floor(Math.random() * (effectiveWidth / SQUARE_SIZE)) * SQUARE_SIZE + margin * SQUARE_SIZE;
    const headY =
      Math.floor(Math.random() * (effectiveHeight / SQUARE_SIZE)) * SQUARE_SIZE + margin * SQUARE_SIZE;
  
    const snakeLength = 3; // Default snake length
    const possibleDirections = [];
    if (headY + (snakeLength - 1) * SQUARE_SIZE < boardHeight - margin * SQUARE_SIZE)
      possibleDirections.push("DOWN");
    if (headY - (snakeLength - 1) * SQUARE_SIZE >= margin * SQUARE_SIZE)
      possibleDirections.push("UP");
    if (headX + (snakeLength - 1) * SQUARE_SIZE < boardWidth - margin * SQUARE_SIZE)
      possibleDirections.push("RIGHT");
    if (headX - (snakeLength - 1) * SQUARE_SIZE >= margin * SQUARE_SIZE)
      possibleDirections.push("LEFT");
  
    const direction = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
  
    const snakeBody = [{ x: headX, y: headY }];
  
    for (let i = 1; i < snakeLength; i++) {
      const lastSegment = snakeBody[i - 1];
      if (direction === "UP") snakeBody.push({ x: lastSegment.x, y: lastSegment.y + SQUARE_SIZE });
      else if (direction === "DOWN") snakeBody.push({ x: lastSegment.x, y: lastSegment.y - SQUARE_SIZE });
      else if (direction === "LEFT") snakeBody.push({ x: lastSegment.x + SQUARE_SIZE, y: lastSegment.y });
      else if (direction === "RIGHT") snakeBody.push({ x: lastSegment.x - SQUARE_SIZE, y: lastSegment.y });
    }
  
    return { snakeBody, direction };
  }

  // Function to generate a random apple position
  function generateApple() {
    const margin = 2; // Margin in number of squares to keep away from the border
    const effectiveWidth = boardWidth - margin * SQUARE_SIZE * 2;
    const effectiveHeight = boardHeight - margin * SQUARE_SIZE * 2;

    // Ensure effective dimensions are valid
    if (effectiveWidth <= 0 || effectiveHeight <= 0) {
        console.error("Effective dimensions are invalid. Apple cannot be generated.");
        return null; // Return null if dimensions are invalid
    }

    // Generate random position for the apple
    const appleX = Math.floor(Math.random() * (effectiveWidth / SQUARE_SIZE)) * SQUARE_SIZE + margin * SQUARE_SIZE;
    const appleY = Math.floor(Math.random() * (effectiveHeight / SQUARE_SIZE)) * SQUARE_SIZE + margin * SQUARE_SIZE;

    return { x: appleX, y: appleY };
  }

  function generatePotion() {
    const margin = 2; // Margin in number of squares to keep away from the border
    const effectiveWidth = boardWidth - margin * SQUARE_SIZE * 2;
    const effectiveHeight = boardHeight - margin * SQUARE_SIZE * 2;

    // Ensure effective dimensions are valid
    if (effectiveWidth <= 0 || effectiveHeight <= 0) {
        console.error("Effective dimensions are invalid. Potion cannot be generated.");
        return null; // Return null if dimensions are invalid
    }

    // Generate random position for the potion
    const potionX = Math.floor(Math.random() * (effectiveWidth / SQUARE_SIZE)) * SQUARE_SIZE + margin * SQUARE_SIZE;
    const potionY = Math.floor(Math.random() * (effectiveHeight / SQUARE_SIZE)) * SQUARE_SIZE + margin * SQUARE_SIZE;

    return { x: potionX, y: potionY };
  }

    const handleKeyDown = (e) => {
    const invalidChars = ["-", "+", "e", "Escape"];
    if (invalidChars.includes(e.key)) {
        e.preventDefault();
    }
  };

  useEffect(() => {
    const updateDimensions = () => {
        // Use visualViewport for accurate visible area, fallback to window
        const viewportWidth = window.visualViewport?.width || window.innerWidth;
        const viewportHeight = window.visualViewport?.height || window.innerHeight;

        // Dynamically adjust the board dimensions
        const calculatedWidth = Math.min(viewportWidth - 20, 1120); // Max width: 1120px
        const calculatedHeight = Math.min(viewportHeight - 100, 400); // Max height: 400px

        setBoardWidth(calculatedWidth);
        setBoardHeight(calculatedHeight);
    };

    // Update dimensions initially and on window resize
    updateDimensions();
    window.addEventListener('resize', updateDimensions);

    // Cleanup listener on unmount
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    // Generate snake after dimensions are set
    const { snakeBody, direction: newDirection } = generateRandomSnake();
    setSnake(snakeBody);
    dispatch({ type: 'SET_DIRECTION', payload: newDirection });
  }, [boardWidth, boardHeight]);

  useEffect(() => {
    // Initialize apple position
    dispatch({ type: 'SET_APPLE', payload: generateApple() });
  }, [boardWidth, boardHeight]);
  

  useEffect(() => {
    // Check game state and pause/resume x3 multiplier timers
    if (gameState.gameOver) {
      console.log("Game over, clearing x3 multiplier timers");
      clearTimeout(deactivateMultiplierTimer.current);
      clearTimeout(hideMessageTimer.current);
      dispatch({ type: 'SET_SHOW_X3_MESSAGE', payload: false });
      dispatch({ type: 'SET_X3_ACTIVE', payload: false });
      return;
    }
  
    if (gameState.paused) {
      console.log("Game paused, freezing x3 multiplier timers");
      // Freeze x3 multiplier logic (do not start/resume timers)
      clearTimeout(deactivateMultiplierTimer.current);
      clearTimeout(hideMessageTimer.current);
      dispatch({ type: 'SET_SHOW_X3_MESSAGE', payload: false }); // Hide multiplier message when paused
    } else {
      console.log("Game resumed, resuming x3 multiplier logic");
  
      // Resume x3 multiplier logic when the game is resumed
      if (gameState.x3Active) {
        // If the multiplier is active, set timer to deactivate it after 5 seconds
        deactivateMultiplierTimer.current = setTimeout(() => {
          dispatch({ type: 'SET_X3_ACTIVE', payload: false });
          dispatch({ type: 'SET_SHOW_X3_MESSAGE', payload: true });
  
          // Hide message after 1 second
          clearTimeout(hideMessageTimer.current);
          hideMessageTimer.current = setTimeout(() => {
            dispatch({ type: 'SET_SHOW_X3_MESSAGE', payload: false });
          }, 1000);
        }, 5000); // The multiplier lasts for 5 seconds, adjust as needed
      }
    }
  
    return () => {
      // Clean up timers when the component is unmounted or game ends
      clearTimeout(deactivateMultiplierTimer.current);
      clearTimeout(hideMessageTimer.current);
    };
  }, [gameState.paused, gameState.gameOver, gameState.x3Active]);
  
  // Function to activate x3 multiplier
  const activateX3Multiplier = () => {
    if (gameState.paused || gameState.gameOver) return;

    dispatch({ type: 'SET_X3_ACTIVE', payload: true });
    dispatch({ type: 'SET_SHOW_X3_MESSAGE', payload: true });

    // Clear any existing timers
    clearTimeout(deactivateMultiplierTimer.current);
    clearTimeout(hideMessageTimer.current);

    // Timer to deactivate the multiplier after 5 seconds
    deactivateMultiplierTimer.current = setTimeout(() => {
      dispatch({ type: 'SET_X3_ACTIVE', payload: false }); // Deactivate multiplier
      dispatch({ type: 'SET_SHOW_X3_MESSAGE', payload: true }); // Show "inactive" message

      // Timer to hide the message after 1 second
      hideMessageTimer.current = setTimeout(() => {
        dispatch({ type: 'SET_SHOW_X3_MESSAGE', payload: false });
      }, 1000);
    }, 5000);
  };

  useEffect(() => {
    // Skip showing any message on the initial render or if the game hasn't started
    if (!gameState.potionStarted) return;
  
    console.log("x3Active state changed:", gameState.x3Active);
  
    // Clear any existing timer
    if (hideMessageTimer.current) {
      clearTimeout(hideMessageTimer.current);
    }
  
    if (gameState.x3Active) {
      // When x3 is active, show "active" message and hide it after 1 second
      dispatch({ type: 'SET_SHOW_X3_MESSAGE', payload: true });
      hideMessageTimer.current = setTimeout(() => {
        dispatch({ type: 'SET_SHOW_X3_MESSAGE', payload: false });
      }, 1000);
    } else {
      // When x3 is inactive, show "inactive" message and hide it after 1 second
      dispatch({ type: 'SET_SHOW_X3_MESSAGE', payload: true }); // Show "inactive" message
      hideMessageTimer.current = setTimeout(() => {
        dispatch({ type: 'SET_SHOW_X3_MESSAGE', payload: false });
      }, 1000);
    }
  }, [gameState.x3Active, gameState.potionStarted]);

  useEffect(() => {
    pausedRef.current = gameState.paused;
  }, [gameState.paused]);
  
  useEffect(() => {
    gameOverRef.current = gameState.gameOver;
  }, [gameState.gameOver]);

    // Cooldown handler
    const startCooldown = () => {
      dispatch({ type: 'SET_COOLDOWN', payload: true });
      setTimeout(() => {
        dispatch({ type: 'SET_COOLDOWN', payload: false });
      }, 200); // 0.2-second cooldown
    };

  // Key input handler
  useEffect(() => {
    if (controlType === "Phone") return;

    const handleKeyDown = (e) => {
      if (e.key === " " && !gameState.cooldown) {
        // Toggle pause state
        dispatch({ type: 'SET_PAUSED', payload: !gameState.paused });
        startCooldown();
      } else if (!gameState.paused) {
        // Only allow direction changes if not paused
        switch (e.key) {
          case "ArrowUp":
            if (gameState.direction !== "DOWN") dispatch({ type: 'SET_DIRECTION', payload: "UP" });
            break;
          case "ArrowDown":
            if (gameState.direction !== "UP") dispatch({ type: 'SET_DIRECTION', payload: "DOWN" });
            break;
          case "ArrowLeft":
            if (gameState.direction !== "RIGHT") dispatch({ type: 'SET_DIRECTION', payload: "LEFT" });
            break;
          case "ArrowRight":
            if (gameState.direction !== "LEFT") dispatch({ type: 'SET_DIRECTION', payload: "RIGHT" });
            break;
          default:
            break;
        }
      }
    };
  
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState.direction, gameState.paused, gameState.cooldown, controlType]);

  const handleMove = (newDirection) => {
    switch (newDirection) {
      case "UP":
        if (gameState.direction !== "DOWN") dispatch({ type: 'SET_DIRECTION', payload: "UP" });
        break;
      case "DOWN":
        if (gameState.direction !== "UP") dispatch({ type: 'SET_DIRECTION', payload: "DOWN" });
        break;
      case "LEFT":
        if (gameState.direction !== "RIGHT") dispatch({ type: 'SET_DIRECTION', payload: "LEFT" });
        break;
      case "RIGHT":
        if (gameState.direction !== "LEFT") dispatch({ type: 'SET_DIRECTION', payload: "RIGHT" });
        break;
      default:
        break;
    }
  };

  const handlePause = () => {
    // Toggle paused state
    if (controlType === "Phone") {
      dispatch({ type: 'SET_PAUSED', payload: !gameState.paused }); // Dispatch action to toggle pause state
    }
  };

  // Game loop
  useEffect(() => {
      // Stop the game immediately if paused or gameOver
  if (gameState.gameOver || gameState.paused) {
    console.log("Game is paused or over, stopping interval...");
    clearInterval(intervalRef.current);
    return;  // Exit early to prevent any further game logic
  }
    console.log("Direction:", gameState.direction);
    console.log("Snake Position:", snake[0]);
    console.log("current speed:", gameState.speed);
    console.log("Potion: ", gameState.potion);    

    intervalRef.current = setInterval(() => {
      setSnake((prevSnake) => {
        let newSnake = [...prevSnake];
        let head = { ...newSnake[0] };

        switch (gameState.direction) {
          case "UP":
            head.y -= SQUARE_SIZE;
            break;
          case "DOWN":
            head.y += SQUARE_SIZE;
            break;
          case "LEFT":
            head.x -= SQUARE_SIZE;
            break;
          case "RIGHT":
            head.x += SQUARE_SIZE;
            break;
          default:
            break }

        newSnake.unshift(head);

        if (head.x === gameState.apple.x && head.y === gameState.apple.y) {
          dispatch({ type: 'SET_APPLE', payload: generateApple() });
          dispatch({ type: 'SET_SCORE', payload: gameState.score + (gameState.x3Active ? 30 : 10) });
          dispatch({ type: 'SET_SPEED', payload: Math.max(gameState.speed - 10, 100) });
        } else {
          newSnake.pop(); // Remove tail if no collision
        }

        handlePotionCollision(head);

        if (head.x < 0 || head.x >= boardWidth || head.y < 0 || head.y >= boardHeight) {
          dispatch({ type: 'SET_GAME_OVER', payload: true });
          clearInterval(intervalRef.current);
        }

        if (newSnake.slice(1).some(segment => segment.x === head.x && segment.y === head.y)) {
          dispatch({ type: 'SET_GAME_OVER', payload: true });
          clearInterval(intervalRef.current);
        }

        return newSnake;
      });
    }, gameState.speed);

    return () => clearInterval(intervalRef.current);
  }, [gameState.direction, gameState.apple, gameState.potion, gameState.gameOver, boardWidth, gameState.paused, gameState.speed, gameState.x3Active]);

  pausedRef.current = gameState.paused;
  gameOverRef.current = gameState.gameOver;

  console.log("Paused:", pausedRef.current);
  console.log("Game Over:", gameOverRef.current);

    // Load the fruit image once the component mounts
    useEffect(() => {
        const img = new Image();
        img.src = fruit; // Use the imported image file
        img.onload = () => {
          setFruitImg(img); // Set the fruit image once it's loaded
        };
    }, []);

    // Load the fruit image once the component mounts
    useEffect(() => {
        const img = new Image();
        img.src = potionScore; // Use the imported image file
        img.onload = () => {
          setPotionImg(img); // Set the fruit image once it's loaded
        };
    }, []);


  // Clear or freeze timers based on game state
  useEffect(() => {
    if (gameState.gameOver) {
      console.log("Game over, clearing all timers");
      clearTimeout(potionIntervalTimer.current);
      clearTimeout(potionDisappearTimer.current);
      return;
    }
  
    if (gameState.paused) {
      console.log("Game paused, freezing timers");
      // Do nothing to timers on pause
    } else {
      console.log("Game resumed, resuming potion logic");
      // Resume or start timers
      if (!gameState.potion) {
        startPotionInterval(); // Start potion spawn if none exists
      } else {
        startPotionDisappearTimer(); // Resume disappearance timer if potion exists
      }
    }
  
    return () => {
      if (gameState.gameOver) {
        clearTimeout(potionIntervalTimer.current);
        clearTimeout(potionDisappearTimer.current);
      }
    };
  }, [gameState.paused, gameState.gameOver]);

  // Start interval for potion rendering
  const startPotionInterval = () => {
    if (gameState.paused || gameState.gameOver) return;

    const appearTime = Math.random() * 5000 + 15000; // 15-20 seconds

    clearTimeout(potionIntervalTimer.current);

    potionIntervalTimer.current = setTimeout(() => {
      if (!gameState.paused && !gameState.gameOver) {
        dispatch({ type: 'SET_POTION', payload: generatePotion() });
        startPotionDisappearTimer(); // Start disappearance timer
      }
    }, appearTime);
  };
  

  // Disappear potion after 15-25 seconds
  const startPotionDisappearTimer = () => {
    if (gameState.paused || gameState.gameOver || !gameState.potion) return;

    const disappearTime = Math.random() * 5000 + 5000; // 5-10 seconds

    clearTimeout(potionDisappearTimer.current);

    potionDisappearTimer.current = setTimeout(() => {
      if (!gameState.paused && !gameState.gameOver) {
        dispatch({ type: 'SET_POTION', payload: null }); // Remove the potion
        startPotionInterval(); // Restart the interval to spawn a new potion after it disappears
      }
    }, disappearTime);
  };

  // Handle potion eating
  const handlePotionEaten = () => {
    dispatch({ type: 'SET_POTION', payload: null }); // Remove the potion immediately
    clearTimeout(potionDisappearTimer.current); // Stop the disappearance timer
    startPotionInterval(); // Restart the interval to generate a new potion
  };

  // Clear all active timers on pause or game over
  useEffect(() => {
    if (!gameState.paused && !gameState.gameOver) {
      startPotionInterval(); // Begin the potion spawning process
    }
    return () => {
      clearTimeout(potionIntervalTimer.current);
      clearTimeout(potionDisappearTimer.current);
    };
  }, [gameState.paused, gameState.gameOver]);

  useEffect(() => {
    if (gameState.potion) {
      startPotionDisappearTimer(); // Start disappearance timer when a potion appears
    }
    return () => {
      clearTimeout(potionDisappearTimer.current); // Clear timer when potion is removed
    };
  }, [gameState.potion]);

  // Handle potion collision and activate x3 multiplier
  const handlePotionCollision = (head) => {
    if (gameState.potion && head.x === gameState.potion.x && head.y === gameState.potion.y) {
      dispatch({ type: 'SET_POTION', payload: null });
      handlePotionEaten();
      dispatch({ type: 'SET_POTION_STARTED', payload: true });
      activateX3Multiplier(); // Activate multiplier and display message
    }
  };

  useEffect(() => {
    const newApple = generateApple(boardWidth, boardHeight);
    console.log("Generated apple:", newApple);  
    dispatch({ type: 'SET_APPLE', payload: newApple });
  }, []);

  useEffect(() => {
    const buttons = document.querySelectorAll('.control-button');

    buttons.forEach(button => {
        button.addEventListener('focus', (e) => {
            if ('ontouchstart' in window) {
                e.target.blur(); // Remove focus on touch devices
            }
        });
    });

    return () => {
        buttons.forEach(button => {
            button.removeEventListener('focus', (e) => {
                if ('ontouchstart' in window) {
                    e.target.blur();
                }
            });
        });
    };
  }, []);

  const handlePlayAgain = () => {
    // Reload the page
    window.location.reload();
  };
  
  const handleMainMenu = () => navigate("/");

  const handleBack = () => navigate("/")

  const x3Message = gameState.x3Active ? "x3 Score is Active" : "x3 Score is Inactive"
  const scaleFactor = 1.2;
  const PCpause = 'Game Paused <br /> (Press "SPACE" again to Resume)';
  const phonePause = 'Game Paused <br /> (Tap Snake Field again to Resume)';
  const sanitizedMessage1 = DOMPurify.sanitize(PCpause);
  const sanitizedMessage2 = DOMPurify.sanitize(phonePause);

  return (
    <div className="game game-container w-100 min-vh-100">
        <Container>
        <Row className="d-flex align-items-center justify-content-center mt-2">
        <Button className="back-button-ingame" variant="danger" onClick={handleBack}>
          Back
        </Button>
        <div 
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        >
            <h3 
            className="md-4 mt-2" 
            style={{ textAlign: 'center', width: '100%', color:'palegreen', marginBottom: '20px'  }}
            >
              Score: {gameState.score}
            </h3>
        </div>
      <div 
        style={{ 
        height: "40px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: "20px"
        }}
      >
      {gameState.paused && (
      <h4
        style={{ color: "orange" }}
        dangerouslySetInnerHTML={{
          __html: controlType === "PC" ? sanitizedMessage1 : sanitizedMessage2,
      }}
      />
      )}
      {/* X3 Score Status */}
      {gameState.potionStarted && gameState.showX3Message && (
        <h4
          style={{
            color: gameState.x3Active ? "yellow" : "red",
          }}
        >
          {x3Message}
        </h4>
      )}
      </div>
      <LoseModal 
      show={gameState.gameOver} 
      score={gameState.score} 
      onPlayAgain={handlePlayAgain} 
      onMainMenu={handleMainMenu}
      />

      {/* React-Konva Stage */}
      <Stage 
        width={boardWidth} 
        height={boardHeight} 
        style={{ margin: "0 auto" }}
        onClick={handlePause}
        onTouchStart={handlePause}
      >
        <Layer>
          {/* Background (green field) */}
          <Rect
            x={0}
            y={0}
            width={boardWidth}
            height={boardHeight}
            fill="green"
            stroke="black"
          />
          {/* Snake */}
          {snake.map((segment, index) => (
            <Rect
              key={index}
              x={segment.x}
              y={segment.y}
              width={SEGMENT_SIZE}
              height={SEGMENT_SIZE}
              fill={index === 0 ? "orangered" : "brown"}
              cornerRadius={5}
            />
          ))}
          {/* Apple */}
          {fruitImg && gameState.apple && (
              <>
              {console.log(`Apple rendered at: x=${gameState.apple.x}, y=${gameState.apple.y}`)}
              <KonvaImage
                x={gameState.apple.x}
                y={gameState.apple.y}
                width={SQUARE_SIZE * scaleFactor}
                height={SQUARE_SIZE * scaleFactor}
                image={fruitImg} 
              />
            </>
          )}
          {/* Potion */}
          {potionImg && gameState.potion && (
              <>
              {console.log(`Potion rendered at: x=${gameState.potion.x}, y=${gameState.potion.y}`)}
              <KonvaImage
                x={gameState.potion.x}
                y={gameState.potion.y}
                width={SQUARE_SIZE * scaleFactor}
                height={SQUARE_SIZE * scaleFactor}
                image={potionImg} 
              />
            </>
          )}
        </Layer>
      </Stage>
      </Row>
        {controlType === "Phone" && (
        <Row className="d-flex align-items-center justify-content-center mt-5">
          <div className="on-screen-controls" style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
          <div style={{ display: "grid", gridTemplateRows: "repeat(3, 45px)", gridGap: "10px", justifyItems: "center" }}>
              <Button 
                onClick={() => handleMove("UP")} 
                style={{ width: "3rem" }}
                className="control-button"
              >
                <FontAwesomeIcon icon={faArrowUp} />
              </Button>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Button 
                  onClick={() => handleMove("LEFT")} 
                  style={{ width: "3rem", marginRight: "10px" }}
                  className="control-button"
                  >
                  <FontAwesomeIcon icon={faArrowLeft} />
                </Button>
                <Button 
                onClick={() => handleMove("DOWN")} 
                style={{width: "3rem" }}
                className="control-button"
                >
                <FontAwesomeIcon icon={faArrowDown} />
              </Button>
                <Button 
                  onClick={() => handleMove("RIGHT")} 
                  style={{ width: "3rem", marginLeft: "10px" }}
                  className="control-button"
                  >
                  <FontAwesomeIcon icon={faArrowRight} />
                </Button>
              </div>
            </div>
          </div>
        </Row>
        )}
      </Container>
    </div>
  );
};

export default Game;
