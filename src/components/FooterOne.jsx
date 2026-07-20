import Link from "next/link";
import StaticText from "@/components/StaticText";


const FooterOne = () => {
  return (
    <footer className='footer bg-main-25 position-relative z-1'>
      <img
        src='/assets/images/shapes/shape2.png'
        alt=''
        className='shape five animation-scalation'
      />
      <img
        src='/assets/images/shapes/shape6.png'
        alt=''
        className='shape one animation-scalation'
      />
      <div className='py-120 '>
        <div className='container container-two'>
          <div className='row row-cols-xxl-4 row-cols-lg-3 row-cols-sm-2 row-cols-1 gy-5'>
            <div className='col' data-aos='fade-up' data-aos-duration={300}>
              <div className='footer-item'>
                <div className='footer-item__logo'>
                  <Link href='/'>
                    {" "}
                    <img src='/assets/images/logo/logo.png' alt='' />
                  </Link>
                </div>
                <p className='my-32'>
                  <StaticText text={"EduSınaq ilə övladınızın biliyini istədiyiniz vaxt rahatlıqla ölçə bilərsiniz."} />
                </p>
                <ul className='social-list flex-align gap-24'>
                  <li className='social-list__item'>
                    <Link
                      href='https://www.facebook.com'
                      className='text-main-600 text-2xl hover-text-main-two-600'
                    >
                      <i className='ph-bold ph-facebook-logo' />
                    </Link>
                  </li>
                  <li className='social-list__item'>
                    <Link
                      href='https://www.twitter.com'
                      className='text-main-600 text-2xl hover-text-main-two-600'
                    >
                      {" "}
                      <i className='ph-bold ph-twitter-logo' />
                    </Link>
                  </li>
                  <li className='social-list__item'>
                    <Link
                      href='https://www.linkedin.com'
                      className='text-main-600 text-2xl hover-text-main-two-600'
                    >
                      <i className='ph-bold ph-instagram-logo' />
                    </Link>
                  </li>
                  <li className='social-list__item'>
                    <Link
                      href='https://www.pinterest.com'
                      className='text-main-600 text-2xl hover-text-main-two-600'
                    >
                      <i className='ph-bold ph-pinterest-logo' />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className='col' data-aos='fade-up' data-aos-duration={400}>
              <div className='footer-item'>
                <h4 className='footer-item__title mb-32'><StaticText text={"Naviqasiya"} /></h4>
                <ul className='footer-menu'>
                  <li className='mb-16'>
                    <Link
                      href='/about'
                      className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                    >
                      <StaticText text={"Haqqımızda"} />
                    </Link>
                  </li>
                  <li className='mb-16'>
                    <Link
                      href='/pricing-plan'
                      className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                    >
                      <StaticText text={"Planlar"} />
                    </Link>
                  </li>
                  <li className='mb-16'>
                    <Link
                      href='/faq'
                      className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                    >
                      <StaticText text={"Tez-tez verilən suallar"} />
                    </Link>
                  </li>
                  <li className='mb-0'>
                    <Link
                      href='/blog'
                      className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                    >
                      <StaticText text={"Bloq"} />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className='col d-none' data-aos='fade-up' data-aos-duration={600}>
              <div className='footer-item'>
                <h4 className='footer-item__title mb-32'><StaticText text={"Kateqoriyalar"} /></h4>
                <ul className='footer-menu'>
                  <li className='mb-16'>
                    <Link
                      href='/courses'
                      className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                    >
                      <StaticText text={"UI/UX dizaynı"} />
                    </Link>
                  </li>
                  <li className='mb-16'>
                    <Link
                      href='/courses'
                      className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                    >
                      <StaticText text={"Veb proqramlaşdırma"} />
                    </Link>
                  </li>
                  <li className='mb-16'>
                    <Link
                      href='/courses'
                      className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                    >
                      <StaticText text={"Python proqramlaşdırması"} />
                    </Link>
                  </li>
                  <li className='mb-16'>
                    <Link
                      href='/courses'
                      className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                    >
                      <StaticText text={"Rəqəmsal marketinq"} />
                    </Link>
                  </li>
                  <li className='mb-16'>
                    <Link
                      href='/courses'
                      className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                    >
                      <StaticText text={"Qrafik dizayn"} />
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className='col' data-aos='fade-up' data-aos-duration={800}>
              <div className='footer-item'>
                <h4 className='footer-item__title mb-32'><StaticText text={"Əlaqə"} /></h4>
                <div className='flex-align gap-20 mb-24'>
                  <span className='icon d-flex text-32 text-main-600'>
                    <i className='ph ph-phone' />
                  </span>
                  <div className=''>
                    <Link
                      href='tel:(207)555-0119'
                      className='text-neutral-500 d-block hover-text-main-600 mb-4'
                    >
                      <StaticText text={"(207) 555-0119"} />
                    </Link>
                    
                  </div>
                </div>
                <div className='flex-align gap-20 mb-24'>
                  <span className='icon d-flex text-32 text-main-600'>
                    <i className='ph ph-envelope-open' />
                  </span>
                  <div className=''>
                    <Link
                      href='mailto:dwallo@gmail.com'
                      className='text-neutral-500 d-block hover-text-main-600 mb-4'
                    >
                      <StaticText text={"dwallo@gmail.com"} />
                    </Link>
                    
                  </div>
                </div>
                <div className='flex-align gap-20 mb-24'>
                  <span className='icon d-flex text-32 text-main-600'>
                    <i className='ph ph-map-trifold' />
                  </span>
                  <div className=''>
                    <span className='text-neutral-500 d-block mb-4'>
                      <StaticText text={"Bakı şəhəri, Suraxanı rayonu"} />
                    </span>
                    
                  </div>
                </div>
              </div>
            </div>
            <div className='col' data-aos='fade-up' data-aos-duration={1000}>
              <div className='footer-item'>
                <h4 className='footer-item__title mb-32'><StaticText text={"Abunə olun"} /></h4>
                <p className='text-neutral-500'>
                  <StaticText text={"E-poçt ünvanınızı yazaraq yeniliklərdən ilk siz xəbərdar olun."} />
                </p>
                <form action='#' className='mt-24 position-relative'>
                  <input
                    type='email'
                    className='form-control bg-white shadow-none border border-neutral-30 rounded-pill h-52 ps-24 pe-48 focus-border-main-600'
                    placeholder='E-poçt ünvanı'
                  />
                  <button
                    type='submit'
                    className='w-36 h-36 flex-center rounded-circle bg-main-600 text-white hover-bg-main-800 position-absolute top-50 translate-middle-y inset-inline-end-0 me-8'
                  >
                    <i className='ph ph-paper-plane-tilt' />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className='container'>
        {/* bottom Footer */}
        <div className='bottom-footer bg-main-25 border-top border-dashed border-main-100 border-0 py-32'>
          <div className='container container-two'>
            <div className='bottom-footer__inner flex-between gap-3 flex-wrap'>
              <p className='bottom-footer__text'>
                {" "}
                <StaticText text={"Müəllif hüquqları © 2025"} /> <span className='fw-semibold'><StaticText text={"EduSınaq"} />   </span>
                <StaticText text={"Bütün hüquqlar qorunur."} />
              </p>
              <div className='footer-links'>
                <Link
                  href='#'
                  className='text-neutral-500 hover-text-main-600 hover-text-decoration-underline'
                >
                  <StaticText text={"İstifadə qaydaları"} />
                </Link>
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterOne;
