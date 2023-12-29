import { Link } from "react-router-dom";
import { routes } from "./routes";

function App() {
  return (
    <>
      <h1>Animations Demo</h1>
      <p>
        This is a collections of UI animations coming from common UI patterns.
      </p>

      <ul>
        <li>
          <Link to={routes.halfSheet}>half-sheet</Link>
        </li>
      </ul>
    </>
  );
}

export default App;
