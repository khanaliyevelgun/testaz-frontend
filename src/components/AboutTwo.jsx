import Link from "next/link";

const AboutTwo = () => {
  return (
    <section className='about-two py-120 position-relative z-1 bg-main-25'>
      <div className='position-relative'>
        <div className='container'>
          <div className='row gy-xl-0 gy-5 flex-wrap-reverse align-items-center'>
            <div className='col-xl-6 pe-xl-5'>
              <div className='about-two__thumb position-relative'>
                <img
                  src='assets/images/thumbs/about-two-img.png'
                  className='rounded-16 cover-img  wow bounceIn'
                  alt=''
                  data-tilt=''
                  data-tilt-max={10}
                  data-tilt-speed={500}
                  data-tilt-perspective={5000}
                  data-tilt-full-page-listening=''
                />
                <span className='shadow-main-three w-80 h-80 flex-center bg-main-three-600 rounded-circle position-absolute inset-block-start-0 inset-inline-start-0 mt-40 ms--40 animation-upDown'>
                  <img
                    src='assets/images/icons/bulb-icon.png'
                    className=''
                    alt=''
                  />
                </span>
                <div className='offer-message d-none two px-24 py-12 rounded-12 bg-white fw-medium box-shadow-lg flex-align d-inline-flex gap-16 animation-upDown'>
                  <span className='flex-shrink-0 w-48 h-48 bg-purple-400 text-white text-2xl flex-center rounded-circle'>
                    <i className='ph ph-watch' />
                  </span>
                  <div>
                    <h6 className='mb-4'>20% ENDİRİM</h6>
                    <span className=''>Bütün planlarda</span>
                  </div>
                </div>
                <div className='offer-message style-two d-none me-lg-0 me-24 px-24 py-12 rounded-12 bg-white fw-medium flex-align d-inline-flex gap-16 box-shadow-lg animation-upDown'>
                  <span className='flex-shrink-0 w-48 h-48 bg-main-two-600 text-white text-2xl flex-center rounded-circle'>
                    <img src='assets/images/icons/stars-white.png' alt='' />
                  </span>
                  <div>
                    <span className='text-lg text-neutral-700 d-block'>
                      4.6
                      <span className='text-neutral-100'>(2.4k)</span>
                    </span>
                    <span className='text-neutral-500'>Rəy ortalaması</span>
                  </div>
                </div>
                <div className='position-absolute inset-block-end-0 inset-inline-end-0 me-lg-0 me-24 px-24 py-12 rounded-12 bg-white fw-medium flex-align d-inline-flex gap-16 box-shadow-lg animation-upDown'>
                  <div className='text-center'>
                    <img
                      src='assets/images/icons/circle-progress.png'
                      className='d-sm-flex d-none mb-24'
                      alt=''
                    />
                    <h6 className='mb-4 text-neutral-700 text-2xl'>Aydın</h6>
                    <span className='text-sm text-neutral-500'>
                      Ölçülə bilən inkişaf
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className='col-xl-6'>
              <div className='about-two-content'>
                <div className='mb-40'>
                  <div className='flex-align d-inline-flex gap-8 mb-16 wow bounceInDown'>
                    <span className='text-main-600 text-2xl d-flex'>
                      <i className='ph-bold ph-book' />
                    </span>
                    <h5 className='text-main-600 mb-0'>Niyə biz?</h5>
                  </div>
                  <h2 className='mb-24 wow bounceIn'>
                    Məqsədimiz biliyi ölçmək, inkişafı görünən etməkdir
                  </h2>
                  <p className='text-neutral-500 text-line-2 wow bounceInUp'>
                    Missiyamız valideynlərə və tələbələrə real bilik səviyyəsini
                    aydın göstərən, süni intellektlə dəstəklənən sınaq və analiz
                    sistemi təqdim etməkdir. Vizyonumuz hər uşağın hazırlığını
                    vaxtında izləyə bildiyi, zəif mövzuları sürətlə gücləndirdiyi
                    şəffaf və əlçatan təhsil mühiti qurmaqdır.
                  </p>
                </div>
                <div className='grid-cols-2'>
                  <div
                    className='flex-align align-items-start gap-20 animation-item'
                    data-aos='fade-up'
                    data-aos-duration={600}
                  >
                    <span className='flex-shrink-0 w-60 h-60 flex-center d-inline-flex bg-white text-main-600 text-40 rounded-circle box-shadow-md'>
                      <img
                        src='assets/images/icons/choose-us-icon1.png'
                        className='animate__swing'
                        alt=''
                      />
                    </span>
                    <div className='flex-grow-1'>
                      <h6 className='text-neutral-800 text-xl fw-medium mb-8'>
                        Dəqiq sınaqlar
                      </h6>
                      <p className='text-neutral-500 text-line-2'>
                        Mövzuya uyğun testlər bilik səviyyəsini obyektiv ölçür.
                      </p>
                    </div>
                  </div>
                  <div
                    className='flex-align align-items-start gap-20 animation-item'
                    data-aos='fade-up'
                    data-aos-duration={800}
                  >
                    <span className='flex-shrink-0 w-60 h-60 flex-center d-inline-flex bg-white text-main-600 text-40 rounded-circle box-shadow-md'>
                      <img
                        src='assets/images/icons/choose-us-icon2.png'
                        className='animate__swing'
                        alt=''
                      />
                    </span>
                    <div className='flex-grow-1'>
                      <h6 className='text-neutral-800 text-xl fw-medium mb-8'>
                        Süni intellektli suallar
                      </h6>
                      <p className='text-neutral-500 text-line-2'>
                        Hər sınaqda yeni və məqsədli suallar hazırlanır.
                      </p>
                    </div>
                  </div>
                  <div
                    className='flex-align align-items-start gap-20 animation-item'
                    data-aos='fade-up'
                    data-aos-duration={1000}
                  >
                    <span className='flex-shrink-0 w-60 h-60 flex-center d-inline-flex bg-white text-main-600 text-40 rounded-circle box-shadow-md'>
                      <img
                        src='assets/images/icons/choose-us-icon3.png'
                        className='animate__swing'
                        alt=''
                      />
                    </span>
                    <div className='flex-grow-1'>
                      <h6 className='text-neutral-800 text-xl fw-medium mb-8'>
                        Nəticə analizi
                      </h6>
                      <p className='text-neutral-500 text-line-2'>
                        Güclü və zəif mövzular hesabatlarda aydın görünür.
                      </p>
                    </div>
                  </div>
                  <div
                    className='flex-align align-items-start gap-20 animation-item'
                    data-aos='fade-up'
                    data-aos-duration={1200}
                  >
                    <span className='flex-shrink-0 w-60 h-60 flex-center d-inline-flex bg-white text-main-600 text-40 rounded-circle box-shadow-md'>
                      <img
                        src='assets/images/icons/choose-us-icon4.png'
                        className='animate__swing'
                        alt=''
                      />
                    </span>
                    <div className='flex-grow-1'>
                      <h6 className='text-neutral-800 text-xl fw-medium mb-8'>
                        Valideyn nəzarəti
                      </h6>
                      <p className='text-neutral-500 text-line-2'>
                        Valideynlər inkişafı izləyir və düzgün qərar verir.
                      </p>
                    </div>
                  </div>
                </div>
                <div className='pt-40 border-top border-neutral-50 mt-40 border-dashed border-0'>
                  <Link
                    href='/course'
                    className='btn btn-main rounded-pill flex-align d-inline-flex gap-8'
                  >
                    Daha çox
                    <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutTwo;
