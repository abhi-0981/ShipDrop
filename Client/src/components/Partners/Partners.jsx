import one from "../../assets/images/one.png";
import two from "../../assets/images/two.png";
import three from "../../assets/images/three.png";
import four from "../../assets/images/four.png";

import "./Partners.css";

function Partners() {
  const row1 = [one, two, three, four, one, two, three, four];

  const row2 = [four, three, two, one, four, three, two, one];

  return (
    <section className="partners-section">
      <div className="partners-container">
        <h2 className="partners-title">
          <span>Reach 99.9% of India</span>
          <br />
          Through Our Courier Partner Network
        </h2>

        <div className="partners-slider">
          <div className="slider-track slider-left">
            {[...row1, ...row1].map((logo, index) => (
              <div className="logo-card" key={index}>
                <img src={logo} alt="" />
              </div>
            ))}
          </div>

          <div className="slider-track slider-right">
            {[...row2, ...row2].map((logo, index) => (
              <div className="logo-card" key={index}>
                <img src={logo} alt="" />
              </div>
            ))}
          </div>
        </div>

        <button className="partner-btn">Explore Solutions</button>
      </div>
    </section>
  );
}

export default Partners;