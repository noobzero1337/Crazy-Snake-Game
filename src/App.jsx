import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";

import MainMenu from "./Pages/MainMenu";
import HowToPlay from "./Pages/HowToPlay";
import Game from "./Pages/Game";
import SelectControl from "./Pages/SelectControl";

import NotFound from "./Pages/NotFound";

const App = () => {

  return (
    <div>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/how2play" element={<HowToPlay />} />
        <Route path="/controlselect" element={<SelectControl />} />
        <Route path="/game" element={<Game />} />
        <Route path="/*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
