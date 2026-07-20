"use client";
import Slider from "react-slick";
import StaticText from "@/components/StaticText";


const FeaturesOne = () => {
  const settings = {
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: false,
    autoplaySpeed: 2000,
    speed: 900,
    dots: false,
    pauseOnHover: true,
    arrows: false,
    infinite: true,

    responsive: [
      {
        breakpoint: 991,
        settings: {
          slidesToShow: 2,
          arrows: false,
        },
      },
      {
        breakpoint: 767,
        settings: {
          slidesToShow: 2,
          arrows: false,
        },
      },
      {
        breakpoint: 575,
        settings: {
          slidesToShow: 1,
          arrows: false,
        },
      },
    ],
  };

  return (
    <section className='features py-120 position-relative overflow-hidden'>
      <img
        src='assets/images/shapes/shape2.png'
        alt=''
        className='shape two animation-scalation'
      />
      <img
        src='assets/images/shapes/shape4.png'
        alt=''
        className='shape six animation-walking'
      />
      <div className='container'>
        <div className='section-heading text-center'>
          <h2 className='mb-24 wow bounceIn'>
            <StaticText text={"Üç addımda övladınızın biliyini görün"} />
          </h2>
          <p className='wow bounceInUp'>
            <StaticText text={"Mövzunu seçin, sınağa başlayın və nəticəni aydın hesabatla izləyin. Harada güclüdür, harada dəstəyə ehtiyacı var - hamısı görünür."} />
          </p>
        </div>
        <Slider {...settings} className='features-slider'>
          <div className='px-8' data-aos='zoom-in' data-aos-duration={400}>
            <div className='features-item item-hover animation-item bg-main-25 border border-neutral-30 rounded-16 transition-1 hover-bg-main-600 hover-border-main-600'>
              <span className='mb-32 w-110 h-110 flex-center bg-white rounded-circle'>
                <img
                  src='assets/images/icons/feature-icon1.png'
                  className='animate__bounce'
                  alt=''
                />
              </span>
              <h4 className='mb-16 transition-1 item-hover__text'>
                <StaticText text={"Mövzunu seçin"} />
              </h4>
              <p className='transition-1 item-hover__text '>
                <StaticText text={"Övladınızın məktəbdə keçdiyi mövzunu seçin. Riyaziyyat, fizika, kimya, Azərbaycan dili və digər əsas fənlər üzrə sınaq hazırlayın."} />
              </p>
            </div>
          </div>
          <div className='px-8' data-aos='zoom-in' data-aos-duration={800}>
            <div className='features-item item-hover animation-item bg-main-25 border border-neutral-30 rounded-16 transition-1 hover-bg-main-600 hover-border-main-600'>
              <span className='mb-32 w-110 h-110 flex-center bg-white rounded-circle'>
                <img
                  src='assets/images/icons/feature-icon2.png'
                  className='animate__bounce'
                  alt=''
                />
              </span>
              <h4 className='mb-16 transition-1 item-hover__text'>
                <StaticText text={"Sınağa başlayın"} />
              </h4>
              <p className='transition-1 item-hover__text'>
                <StaticText text={"Qısa və fokuslu testlə real bilik yoxlanır. Suallar hər dəfə yenilənir, ona görə cavabı əzbərləmək yox, mövzunu anlamaq önə çıxır."} />
              </p>
            </div>
          </div>
          <div className='px-8' data-aos='zoom-in' data-aos-duration={1200}>
            <div className='features-item item-hover animation-item bg-main-25 border border-neutral-30 rounded-16 transition-1 hover-bg-main-600 hover-border-main-600'>
              <span className='mb-32 w-110 h-110 flex-center bg-white rounded-circle'>
                <img
                  src='assets/images/icons/feature-icon3.png'
                  className='animate__bounce'
                  alt=''
                />
              </span>
              <h4 className='mb-16 transition-1 item-hover__text'>
                <StaticText text={"Nəticəni görün"} />
              </h4>
              <p className='transition-1 item-hover__text '>
                <StaticText text={"Səhvlər, zəif mövzular və növbəti öyrənmə addımları bir hesabatda toplanır. Nə üzərində işləmək lazım olduğu dərhal aydın olur."} />
              </p>
            </div>
          </div>
        </Slider>
        <div className='flex-align gap-16 mt-40 justify-content-center'>
          <button
            type='button'
            id='features-prev'
            className='slick-prev slick-arrow flex-center rounded-circle border border-gray-100 hover-border-main-600 text-xl hover-bg-main-600 hover-text-white transition-1 w-48 h-48'
          >
            <i className='ph ph-caret-left' />
          </button>
          <button
            type='button'
            id='features-next'
            className='slick-next slick-arrow flex-center rounded-circle border border-gray-100 hover-border-main-600 text-xl hover-bg-main-600 hover-text-white transition-1 w-48 h-48'
          >
            <i className='ph ph-caret-right' />
          </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturesOne;
