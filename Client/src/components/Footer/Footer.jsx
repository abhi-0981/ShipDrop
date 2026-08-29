import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaXTwitter,
  FaLocationDot,
} from "react-icons/fa6";

import { MdEmail } from "react-icons/md";

import googleStore from "../../assets/images/google-store.png";
import appStore from "../../assets/images/app-store.png";

function Footer() {
  return (
    <footer className="bg-[#111827] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-4">
          {/* Left Section */}

          <div>
            <h2 className="mb-4 text-2xl font-bold text-[#008dd2]">
              ShipDrop
            </h2>

            <p className="max-w-[220px] text-[14px] leading-7 text-gray-300">
              ShipDrop is a leading eCommerce logistics enabler for India's
              growing online businesses. Offering scalable shipping and
              fulfillment solutions powered by modern technology.
            </p>

            <h3 className="mt-8 mb-4 text-xl font-semibold">
              Follow Us
            </h3>

            <div className="flex gap-4 text-lg text-gray-300">
              <FaFacebookF className="cursor-pointer hover:text-[#008dd2]" />

              <FaXTwitter className="cursor-pointer hover:text-[#008dd2]" />

              <FaYoutube className="cursor-pointer hover:text-[#008dd2]" />

              <FaInstagram className="cursor-pointer hover:text-[#008dd2]" />

              <FaLinkedinIn className="cursor-pointer hover:text-[#008dd2]" />
            </div>
          </div>

          {/* Services */}

          <div>
            <h3 className="mb-4 text-xl font-semibold">
              Services
            </h3>

            <ul className="space-y-3 text-[14px] text-gray-300">
              <li className="cursor-pointer hover:text-[#008dd2]">
                Domestic Shipping
              </li>

              <li className="cursor-pointer hover:text-[#008dd2]">
                Warehouse & Fulfillment
              </li>
            </ul>

            <h3 className="mt-8 mb-4 text-xl font-semibold">
              Quick Links
            </h3>

            <ul className="space-y-3 text-[14px] text-gray-300">
              <li className="cursor-pointer hover:text-[#008dd2]">
                About Us
              </li>

              <li className="cursor-pointer hover:text-[#008dd2]">
                Media
              </li>

              <li className="cursor-pointer hover:text-[#008dd2]">
                Blogs
              </li>

              <li className="cursor-pointer hover:text-[#008dd2]">
                Contact Us
              </li>

              <li className="cursor-pointer hover:text-[#008dd2]">
                Careers
              </li>
            </ul>
          </div>

          {/* Features */}

          <div>
            <h3 className="mb-4 text-xl font-semibold">
              Features
            </h3>

            <ul className="space-y-3 text-[14px] text-gray-300">
              <li className="cursor-pointer hover:text-[#008dd2]">
                Branded Tracking Page
              </li>

              <li className="cursor-pointer hover:text-[#008dd2]">
                NDR Management
              </li>

              <li className="cursor-pointer hover:text-[#008dd2]">
                Early Payout
              </li>

              <li className="cursor-pointer hover:text-[#008dd2]">
                COD Order Confirmation
              </li>

              <li className="cursor-pointer hover:text-[#008dd2]">
                Serviceable Pin Codes
              </li>

              <li className="cursor-pointer hover:text-[#008dd2]">
                Multiple Pickup Locations
              </li>

              <li className="cursor-pointer hover:text-[#008dd2]">
                Print Shipping Labels
              </li>

              <li className="cursor-pointer hover:text-[#008dd2]">
                Email & SMS Notifications
              </li>
            </ul>
          </div>

          {/* Contact */}

          <div>
            <h3 className="mb-4 text-xl font-semibold">
              Contact Us
            </h3>

            <div className="mb-5 flex items-start gap-3">
              <FaLocationDot className="mt-1 text-lg text-[#ff4d8d]" />

              <p className="text-[14px] leading-6 text-gray-300">
                8th Floor, Splendor Spectrum One, Golf Course Ext Rd, Sector
                58, Gurugram, Haryana 122011
              </p>
            </div>

            <div className="mb-6 flex items-center gap-3">
              <MdEmail className="text-lg text-[#008dd2]" />

              <p className="text-[14px] text-gray-300">
                care@shipdrop.com
              </p>
            </div>

            <h3 className="mb-4 text-xl font-semibold">
              Download App
            </h3>

            <div className="flex gap-3">
              <img
                src={googleStore}
                alt=""
                className="h-9 rounded-md"
              />

              <img
                src={appStore}
                alt=""
                className="h-9 rounded-md"
              />
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-gray-700 pt-5 text-[13px] text-gray-400 md:flex-row">
          <p>© 2026 ShipDrop. All rights reserved.</p>

          <div className="flex gap-5">
            <p className="cursor-pointer hover:text-white">
              Terms and Conditions
            </p>

            <p className="cursor-pointer hover:text-white">
              Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;