import Positions from "@/components/Positions";
import Navbar from "@/components/Navbar";
import Dashboard from "@/components/Dashboard";


export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      {/* <Positions /> */}
      <Dashboard />
    </div>
  );
}