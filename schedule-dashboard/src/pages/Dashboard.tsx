import ClockCard from "../cards/ClockCard";
import CountdownCard from "../cards/CountdownCard";
import TodayEventsCard from "../cards/TodayEventsCard";
import TodoCard from "../cards/TodoCard";
import MemoCard from "../cards/MemoCard";

export default function Dashboard() {
  return (
    <div className="grid">
      <ClockCard />
      <CountdownCard />
      <TodayEventsCard />
      <TodoCard />
      <MemoCard />
    </div>
  );
}
