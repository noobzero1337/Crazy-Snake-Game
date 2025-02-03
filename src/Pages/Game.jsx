import { useState, useEffect, useRef } from "react";
import { Container, Button, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { Stage, Layer, Rect, Image as KonvaImage } from "react-konva";
import DOMPurify from "dompurify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown, faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import LoseModal from "../Components/LoseModal";
import fruit from "../assets/img/fruit.png";
import potionScore from "../assets/img/potionScore.png";


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

  const [boardWidth, setBoardWidth] = useState(1120); // Default width
  const [boardHeight, setBoardHeight] = useState(400); // Default height
  const [snake, setSnake] = useState([]);
  const [apple, setApple] = useState(null);
  const [fruitImg, setFruitImg] = useState(null)
  const [potionImg, setPotionImg] = useState(null);
  const [potion, setPotion] = useState(null);
  const [direction, setDirection] = useState("RIGHT");
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(200);
  const [x3Active, setX3Active] = useState(false);
  const [showX3Message, setShowX3Message] = useState(false);
  const [potionStarted, setPotionStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [canPause, setCanPause] = useState(true);
  const [cooldown, setCooldown] = useState(false);
  const [controlType, setControlType] = useState(getStoredControl);

  const potionIntervalTimer = useRef(null);
  const potionDisappearTimer = useRef(null);
  const hideMessageTimer = useRef(null);
  const deactivateMultiplierTimer = useRef(null);
  const pausedRef = useRef(paused);
  const gameOverRef = useRef(gameOver);
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
    setDirection(newDirection);
  }, [boardWidth, boardHeight]);

  useEffect(() => {
    // Initialize apple position
    setApple(generateApple()); 
  }, [boardWidth, boardHeight]);
  

  useEffect(() => {
    // Check game state and pause/resume x3 multiplier timers
    if (gameOver) {
      console.log("Game over, clearing x3 multiplier timers");
      clearTimeout(deactivateMultiplierTimer.current);
      clearTimeout(hideMessageTimer.current);
      setShowX3Message(false);
      setX3Active(false);
      return;
    }
  
    if (paused) {
      console.log("Game paused, freezing x3 multiplier timers");
      // Freeze x3 multiplier logic (do not start/resume timers)
      clearTimeout(deactivateMultiplierTimer.current);
      clearTimeout(hideMessageTimer.current);
      setShowX3Message(false); // Hide multiplier message when paused
    } else {
      console.log("Game resumed, resuming x3 multiplier logic");
  
      // Resume x3 multiplier logic when the game is resumed
      if (x3Active) {
        // If the multiplier is active, set timer to deactivate it after 5 seconds
        deactivateMultiplierTimer.current = setTimeout(() => {
          setX3Active(false);
          setShowX3Message(true);
  
          // Hide message after 1 second
          clearTimeout(hideMessageTimer.current);
          hideMessageTimer.current = setTimeout(() => {
            setShowX3Message(false);
          }, 1000);
        }, 5000); // The multiplier lasts for 5 seconds, adjust as needed
      }
    }
  
    return () => {
      // Clean up timers when the component is unmounted or game ends
      clearTimeout(deactivateMultiplierTimer.current);
      clearTimeout(hideMessageTimer.current);
    };
  }, [paused, gameOver, x3Active]);
  
  // Function to activate x3 multiplier
  const activateX3Multiplier = () => {
    if (paused || gameOver) return;

    setX3Active(true); // Activate multiplier
    setShowX3Message(true); // Show "active" message

    // Clear any existing timers
    clearTimeout(deactivateMultiplierTimer.current);
    clearTimeout(hideMessageTimer.current);

    // Timer to deactivate the multiplier after 5 seconds
    deactivateMultiplierTimer.current = setTimeout(() => {
      setX3Active(false); // Deactivate multiplier
      setShowX3Message(true); // Show "inactive" message

      // Timer to hide the message after 1 second
      hideMessageTimer.current = setTimeout(() => {
        setShowX3Message(false);
      }, 1000);
    }, 5000);
  };

  useEffect(() => {
    // Skip showing any message on the initial render or if the game hasn't started
    if (!potionStarted) return;
  
    console.log("x3Active state changed:", x3Active);
  
    // Clear any existing timer
    if (hideMessageTimer.current) {
      clearTimeout(hideMessageTimer.current);
    }
  
    if (x3Active) {
      // When x3 is active, show "active" message and hide it after 1 second
      setShowX3Message(true);
      hideMessageTimer.current = setTimeout(() => {
        setShowX3Message(false);
      }, 1000);
    } else {
      // When x3 is inactive, show "inactive" message and hide it after 1 second
      setShowX3Message(true); // Show "inactive" message
      hideMessageTimer.current = setTimeout(() => {
        setShowX3Message(false);
      }, 1000);
    }
  }, [x3Active, potionStarted]);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

    // Cooldown handler
    const startCooldown = () => {
      setCooldown(true);
      setTimeout(() => {
        setCooldown(false);
      }, 200); // 0.2-second cooldown
    };

  // Key input handler
  useEffect(() => {
    if (controlType === "Phone") return;

    const handleKeyDown = (e) => {
      if (e.key === " " && !cooldown) {
        // Toggle pause state
        setPaused((prevPaused) => {
          // Toggle paused state and start cooldown
          const newPausedState = !prevPaused;
          startCooldown();
          return newPausedState;
        });
      } else if (!paused) {
        // Only allow direction changes if not paused
        switch (e.key) {
          case "ArrowUp":
            if (direction !== "DOWN") setDirection("UP");
            break;
          case "ArrowDown":
            if (direction !== "UP") setDirection("DOWN");
            break;
          case "ArrowLeft":
            if (direction !== "RIGHT") setDirection("LEFT");
            break;
          case "ArrowRight":
            if (direction !== "LEFT") setDirection("RIGHT");
            break;
          default:
            break;
        }
      }
    };
  
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [direction, paused, canPause, cooldown, controlType]);

  const handleMove = (newDirection) => {
    // Update direction for on-screen button press
    switch (newDirection) {
      case "UP":
        if (direction !== "DOWN") setDirection("UP");
        break;
      case "DOWN":
        if (direction !== "UP") setDirection("DOWN");
        break;
      case "LEFT":
        if (direction !== "RIGHT") setDirection("LEFT");
        break;
      case "RIGHT":
        if (direction !== "LEFT") setDirection("RIGHT");
        break;
      default:
        break;
    }
  };

  const handleKeyDown = (e) => {
    const invalidChars = ["-", "+", "e", "Escape"];
    if (invalidChars.includes(e.key)) {
        e.preventDefault();
    }
  };

  const handlePause = () => {
    // Toggle paused state
    if (controlType === "Phone") {
      setPaused((prevPaused) => !prevPaused); // Call handlePause only for Phone
    }
  };

  // Game loop
  useEffect(() => {
      // Stop the game immediately if paused or gameOver
  if (gameOver || paused) {
    console.log("Game is paused or over, stopping interval...");
    clearInterval(intervalRef.current);
    return;  // Exit early to prevent any further game logic
  }
    console.log("Direction:", direction);
    console.log("Snake Position:", snake[0]);
    console.log("current speed:", speed);
    console.log("Potion: ", potion);
    intervalRef.current = setInterval(() => {
      setSnake((prevSnake) => {
        let newSnake = [...prevSnake];
        let head = { ...newSnake[0] };

        // Update head position
        switch (direction) {
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
            break;
        }

        newSnake.unshift(head);

        // Check collision with apple (only once per loop)
        if (head.x === apple.x && head.y === apple.y) {
          console.log(`Apple eaten at: x=${apple.x}, y=${apple.y}`);
          setApple(generateApple(boardWidth, boardHeight)); // Re-generate apple after eating it
          setScore(score + (x3Active ? 30 : 10)); // Increase score by 10
          setSpeed(Math.max(speed - 10, 100));
        } else {
          newSnake.pop(); // Remove tail if no collision
        }

        handlePotionCollision(head);

        // Check collision with walls
        if (
          head.x < 0 ||
          head.x >= boardWidth ||
          head.y < 0 ||
          head.y >= boardHeight
        ) {
          setGameOver(true);
          clearInterval(intervalRef.current);
        }

        // Check collision with itself
        if (
          newSnake.slice(1).some(
            (segment) => segment.x === head.x && segment.y === head.y
          )
        ) {
          setGameOver(true);
          clearInterval(intervalRef.current);
        }

        return newSnake;
      });
    }, speed);

    return () => clearInterval(intervalRef.current);
  }, [direction, apple, potion, gameOver, boardWidth, paused, speed, x3Active]);

  pausedRef.current = paused;
  gameOverRef.current = gameOver;

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
    if (gameOver) {
      console.log("Game over, clearing all timers");
      clearTimeout(potionIntervalTimer.current);
      clearTimeout(potionDisappearTimer.current);
      return;
    }
  
    if (paused) {
      console.log("Game paused, freezing timers");
      // Do nothing to timers on pause
    } else {
      console.log("Game resumed, resuming potion logic");
      // Resume or start timers
      if (!potion) {
        startPotionInterval(); // Start potion spawn if none exists
      } else {
        startPotionDisappearTimer(); // Resume disappearance timer if potion exists
      }
    }
  
    return () => {
      if (gameOver) {
        clearTimeout(potionIntervalTimer.current);
        clearTimeout(potionDisappearTimer.current);
      }
    };
  }, [paused, gameOver]);

  // Start interval for potion rendering
  const startPotionInterval = () => {
    if (paused || gameOver) return;

    const appearTime = Math.random() * 5000 + 15000; // 15-20 seconds

    clearTimeout(potionIntervalTimer.current);

    potionIntervalTimer.current = setTimeout(() => {
      if (!paused && !gameOver) {
        setPotion(generatePotion());
        startPotionDisappearTimer(); // Start disappearance timer
      }
    }, appearTime);
  };
  

  // Disappear potion after 15-25 seconds
  const startPotionDisappearTimer = () => {
    if (paused || gameOver || !potion) return;

    const disappearTime = Math.random() * 5000 + 5000; // 5-10 seconds

    clearTimeout(potionDisappearTimer.current);

    potionDisappearTimer.current = setTimeout(() => {
      if (!paused && !gameOver) {
        setPotion(null); // Remove the potion
        startPotionInterval(); // Restart the interval to spawn a new potion after it disappears
      }
    }, disappearTime);
  };

  // Handle potion eating
  const handlePotionEaten = () => {
    setPotion(null); // Remove the potion immediately
    clearTimeout(potionDisappearTimer.current); // Stop the disappearance timer
    startPotionInterval(); // Restart the interval to generate a new potion
  };

  // Clear all active timers on pause or game over
  useEffect(() => {
    if (!paused && !gameOver) {
      startPotionInterval(); // Begin the potion spawning process
    }
    return () => {
      clearTimeout(potionIntervalTimer.current);
      clearTimeout(potionDisappearTimer.current);
    };
  }, [paused, gameOver]);

  useEffect(() => {
    if (potion) {
      startPotionDisappearTimer(); // Start disappearance timer when a potion appears
    }
    return () => {
      clearTimeout(potionDisappearTimer.current); // Clear timer when potion is removed
    };
  }, [potion]);

  // Handle potion collision and activate x3 multiplier
  const handlePotionCollision = (head) => {
    if (potion && head.x === potion.x && head.y === potion.y) {
      setPotion(null);
      handlePotionEaten();
      setPotionStarted(true);
      activateX3Multiplier(); // Activate multiplier and display message
    }
  };

  useEffect(() => {
    const newApple = generateApple(boardWidth, boardHeight);
    console.log("Generated apple:", newApple);  
    setApple(newApple);
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

  const x3Message = x3Active ? "x3 Score is Active" : "x3 Score is Inactive"
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
              Score: {score}
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
      {paused && (
      <h4
        style={{ color: "orange" }}
        dangerouslySetInnerHTML={{
          __html: controlType === "PC" ? sanitizedMessage1 : sanitizedMessage2,
      }}
      />
      )}
      {/* X3 Score Status */}
      {potionStarted && showX3Message && (
        <h4
          style={{
            color: x3Active ? "yellow" : "red",
          }}
        >
          {x3Message}
        </h4>
      )}
      </div>
      <LoseModal 
      show={gameOver} 
      score={score} 
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
          {fruitImg && apple && (
              <>
              {console.log(`Apple rendered at: x=${apple.x}, y=${apple.y}`)}
              <KonvaImage
                x={apple.x}
                y={apple.y}
                width={SQUARE_SIZE * scaleFactor}
                height={SQUARE_SIZE * scaleFactor}
                image={fruitImg} 
              />
            </>
          )}
          {/* Potion */}
          {potionImg && potion && (
              <>
              {console.log(`Potion rendered at: x=${potion.x}, y=${potion.y}`)}
              <KonvaImage
                x={potion.x}
                y={potion.y}
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
        <Row className="d-flex align-items-center justify-content-center mt-4">
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
                  style={{ width: "3rem", marginRight: "4rem" }}
                  className="control-button"
                  >
                  <FontAwesomeIcon icon={faArrowLeft} />
                </Button>
                <Button 
                  onClick={() => handleMove("RIGHT")} 
                  style={{ width: "3rem" }}
                  className="control-button"
                  >
                  <FontAwesomeIcon icon={faArrowRight} />
                </Button>
              </div>
              <Button 
                onClick={() => handleMove("DOWN")} 
                style={{width: "3rem" }}
                className="control-button"
                >
                <FontAwesomeIcon icon={faArrowDown} />
              </Button>
            </div>
          </div>
        </Row>
        )}
      </Container>
    </div>
  );
};

export default Game;
