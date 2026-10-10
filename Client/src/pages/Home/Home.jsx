import Navbar from "../../components/Navbar/Navbar";
import PublicTracking from "../../components/PublicTracking/PublicTracking";

import Slider from "../../components/Slider/Slider";
import Banner from "../../components/Banner/Banner";
import RTO from "../../components/RTO/RTO";
import Partners from "../../components/Partners/Partners";
import AppDownload from "../../components/AppDownload/AppDownload";
import Testimonials from "../../components/Testimonials/Testimonials";
import CTA from "../../components/CTA/CTA";
import Footer from "../../components/Footer/Footer";

function Home() {
  return (
    <>
      <Navbar />

      <PublicTracking />

      {/* Temporarily hidden */}
      {false && <Slider />}
      {false && <Banner />}
      {false && <RTO />}
      {false && <Partners />}
      {false && <AppDownload />}
      {false && <Testimonials />}
      {false && <CTA />}
      {false && <Footer />}
    </>
  );
}

export default Home;