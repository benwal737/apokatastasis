import { getRooms } from "./actions";
import Home from "./Home";

const page = async () => {
  const rooms = await getRooms();
  return <Home rooms={rooms} />;
};

export default page;
