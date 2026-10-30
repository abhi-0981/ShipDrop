import Navbar from "../../components/Navbar/Navbar";
import PublicTracking from "../../components/PublicTracking/PublicTracking";

function Home() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white transition-colors duration-200 dark:bg-[#090b10]">
        <PublicTracking />
      </main>
    </>
  );
}

export default Home;