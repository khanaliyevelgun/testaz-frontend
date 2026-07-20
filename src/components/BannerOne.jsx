import Link from "next/link";
import StaticText from "@/components/StaticText";


const BannerOne = () => {
  return (
    <section className='banner py-80 position-relative overflow-hidden'>
      <img
        src='assets/images/shapes/shape1.png'
        alt=''
        className='shape one animation-rotation'
      />
      <img
        src='assets/images/shapes/shape2.png'
        alt=''
        className='shape two animation-scalation'
      />
      <img
        src='assets/images/shapes/shape3.png'
        alt=''
        className='shape three animation-walking'
      />
      <img
        src='assets/images/shapes/shape4.png'
        alt=''
        className='shape four animation-scalation'
      />
      <img
        src='assets/images/shapes/shape5.png'
        alt=''
        className='shape five animation-walking'
      />
      <div className='container'>
        <div className='row gy-5 align-items-center'>
          <div className='col-xl-6'>
            <div className='banner-content pe-md-4'>
              <div className='flex-align gap-8 mb-16' data-aos='fade-down'>
                <span className='w-8 h-8 bg-main-600 rounded-circle' />
                <h5 className='text-main-600 mb-0'>
                  {" "}
                  <StaticText text={"Biliyini yoxla, inkişafını izlə"} />
                </h5>
              </div>
              <h1 className='display2 mb-24 wow bounceInLeft'>
                <StaticText text={"Övladınız üçün"} /> {" "}
                <span
                  className='text-main-two-600 wow bounceInLeft'
                  data-wow-duration='2s'
                  data-wow-delay='.5s'
                >
                  <StaticText text={"Doğru"} />
                </span>
                {" "} <StaticText text={"Sınaqlar, Güclü"} /> {" "}
                <span
                  className='text-main-600 wow bounceInUp'
                  data-wow-duration='1s'
                  data-wow-delay='.5s'
                >
                  <StaticText text={"Nəticələr"} />
                </span>
              </h1>
              <p className='text-neutral-500 wow bounceInUp'>
                <StaticText text={"Övladınız oxuyur deyir, amma əmin deyilsiniz? Evdə, telefondan, mövzu seçin və övladınızı sınaqdan keçirin. Süni intellekt hər dəfə yeni suallar yaradır."} />
              </p>
              <div className='buttons-wrapper flex-align flex-wrap gap-24 mt-40'>
                <Link
                  href='/course'
                  className='btn btn-main rounded-pill flex-align gap-8'
                  data-aos='fade-right'
                >
                  <StaticText text={"Qeydiyyatdan keç"} />
                  <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
                </Link>
                <Link
                  href='/contact'
                  className='btn btn-outline-main rounded-pill flex-align gap-8'
                  data-aos='fade-left'
                >
                  <StaticText text={"Əlaqə"} />
                  <i className='ph ph-envelope d-flex text-lg' />
                </Link>
              </div>
            </div>
          </div>
          <div className='col-xl-6'>
            <div className='banner-thumb position-relative'>
              <img
                src='assets/images/thumbs/banner-img.png'
                alt=''
                className='banner-thumb__img rounded-12 wow bounceIn'
                data-wow-duration='3s'
                data-wow-delay='.5s'
                data-tilt=''
                data-tilt-max={12}
                data-tilt-speed={500}
                data-tilt-perspective={5000}
                data-tilt-full-page-listening=''
                data-tilt-scale='1.02'
              />
              <img
                src='assets/images/shapes/curve-arrow.png'
                alt=''
                className='curve-arrow position-absolute'
              />
              <div
                className='banner-box one px-24 py-12 rounded-12 bg-white fw-medium box-shadow-lg d-inline-block'
                data-aos='fade-down'
              >
                <span className='text-main-600'><StaticText text={"36k+"} /></span> <StaticText text={"Suallıq test bazası"} />
              </div>
              <div
                className='banner-box two px-24 py-12 rounded-12 bg-white fw-medium box-shadow-lg flex-align d-inline-flex gap-16'
                data-aos='fade-up'
              >
                <span className='banner-box__icon flex-shrink-0 w-48 h-48 bg-purple-400 text-white text-2xl flex-center rounded-circle'>
                  <i className='ph ph-watch' />
                </span>
                <div>
                  <h6 className='mb-4'><StaticText text={"20% ENDİRİM"} /></h6>
                  <span className=''><StaticText text={"Bütün planlarda"} /></span>
                </div>
              </div>
              <div
                className='banner-box three px-24 py-12 rounded-12 bg-white fw-medium box-shadow-lg flex-align d-inline-flex gap-16'
                data-aos='fade-left'
              >
                <span className='banner-box__icon flex-shrink-0 w-48 h-48 bg-main-50 text-main-600 text-2xl flex-center rounded-circle'>
                  <i className='ph ph-phone-call' />
                </span>
                <div>
                  <span className=''><StaticText text={"Əlaqə"} /></span>
                  <a
                    href='tel:(704)555-0127'
                    className='mt-8 fw-medium text-xl d-block text-main-600 hover-text-main-500'
                  >
                    <StaticText text={"(050) 879-3791"} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BannerOne;
