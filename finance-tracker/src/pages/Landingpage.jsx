import React from 'react'
import Hero from "../components/hero";
import CTABanner from '../components/ctabanner';
import Footer from '../components/footer';
import Contact from '../components/contact';
import Explore from '../components/Explore';
import Dummy from '../components/Dummy'

const Landingpage = () => {
  return (
    <>
      <Hero/>
      <CTABanner/>
      <Explore/>
      <Contact/>
      <Footer/>
      {/* <Dummy/> */}
      

    </>
  )
}

export default Landingpage
