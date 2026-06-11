const ContactInner = () => {
  return (
    <>
      <section className='contact py-120'>
        <div className='container'>
          <div className='section-heading text-center'>
            <div className='flex-align d-inline-flex gap-8 mb-16'>
              <span className='text-main-600 text-2xl d-flex'>
                <i className='ph-bold ph-book' />
              </span>
              <h5 className='text-main-600 mb-0'>Əlaqə</h5>
            </div>
            <h2 className='mb-24'>Sizə kömək etmək üçün buradayıq</h2>
            <p className=''>
              Sınaqlar, sual bazası, nəticə analizi və planlarla bağlı
              suallarınız üçün bizimlə rahat əlaqə saxlaya bilərsiniz.
            </p>
          </div>
          <div className='row gy-4'>
            <div className='col-xl-4 col-md-6'>
              <div className='contact-item bg-main-25 border border-neutral-30 rounded-12 px-32 py-40 d-flex align-items-start gap-24 hover-bg-main-600 transition-2 hover-border-main-600'>
                <span className='contact-item__icon w-60 h-60 text-32 flex-center rounded-circle bg-main-600 text-white flex-shrink-0'>
                  <i className='ph ph-map-pin-line' />
                </span>
                <div className='flex-grow-1'>
                  <h4 className='mb-12'>Ofis ünvanı</h4>
                  <p className='text-neutral-500'>
                    Bakı şəh., Suraxanı ray.
                  </p>
                  <a
                    href='#'
                    className='text-main-600 fw-semibold text-decoration-underline mt-16'
                  >
                    Ünvanı göstər
                  </a>
                </div>
              </div>
            </div>
            <div className='col-xl-4 col-md-6'>
              <div className='contact-item bg-main-25 border border-neutral-30 rounded-12 px-32 py-40 d-flex align-items-start gap-24 hover-bg-main-600 transition-2 hover-border-main-600'>
                <span className='contact-item__icon w-60 h-60 text-32 flex-center rounded-circle bg-main-600 text-white flex-shrink-0'>
                  <i className='ph ph-envelope-open' />
                </span>
                <div className='flex-grow-1'>
                  <h4 className='mb-12'>Email ünvanı</h4>
                  <p className='text-neutral-500'>dwallo@gmail.com</p>
                  <p className='text-neutral-500'>info@edusinaq.az</p>
                  <a
                    href='mailto:dwallo@gmail.com'
                    className='text-main-600 fw-semibold text-decoration-underline mt-16'
                  >
                    Email göndər
                  </a>
                </div>
              </div>
            </div>
            <div className='col-xl-4 col-md-6'>
              <div className='contact-item bg-main-25 border border-neutral-30 rounded-12 px-32 py-40 d-flex align-items-start gap-24 hover-bg-main-600 transition-2 hover-border-main-600'>
                <span className='contact-item__icon w-60 h-60 text-32 flex-center rounded-circle bg-main-600 text-white flex-shrink-0'>
                  <i className='ph ph-phone-call' />
                </span>
                <div className='flex-grow-1'>
                  <h4 className='mb-12'>Telefon nömrəsi</h4>
                  <p className='text-neutral-500'>(050) 879-3791</p>
                  <p className='text-neutral-500'>(207) 555-0119</p>
                  <a
                    href='tel:+994508793791'
                    className='text-main-600 fw-semibold text-decoration-underline mt-16'
                  >
                    Bizə zəng edin
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className='contact-form-section py-240 bg-main-25 position-relative z-1'>
        <img
          src='assets/images/bg/wave-bg.png'
          alt=''
          className='position-absolute top-0 start-0 w-100 h-100 z-n1 d-lg-block d-none'
        />
        <div className='container'>
          <div className='row gy-5 align-items-center'>
            <div className='col-xl-7 col-lg-6 pe-lg-5'>
              <div className='mb-40 md-xl-5'>
                <div className='flex-align d-inline-flex gap-8 mb-16'>
                  <span className='text-main-600 text-2xl d-flex'>
                    <i className='ph-bold ph-book' />
                  </span>
                  <h5 className='text-main-600 mb-0'>Bizimlə əlaqə</h5>
                </div>
                <h2 className='mb-24'>
                  Sualınız var? Bizə yazın
                </h2>
                <p className='text-neutral-500 text-line-3 max-w-636'>
                  EduSınaq valideynlərə və tələbələrə bilik səviyyəsini aydın
                  görmək, zəif mövzuları müəyyən etmək və inkişafı izləmək üçün
                  dəstək olur. Komandamız müraciətinizi qısa zamanda cavablandıracaq.
                </p>
              </div>
              <div className='flex-align gap-40 flex-wrap'>
                <div className='enrolled-students mt-12 d-block'>
                  <img
                    src='assets/images/thumbs/enroll-student-img1.png'
                    alt=''
                    className='w-48 h-48 rounded-circle object-fit-cover transition-2'
                  />
                  <img
                    src='assets/images/thumbs/enroll-student-img2.png'
                    alt=''
                    className='w-48 h-48 rounded-circle object-fit-cover transition-2'
                  />
                  <img
                    src='assets/images/thumbs/enroll-student-img3.png'
                    alt=''
                    className='w-48 h-48 rounded-circle object-fit-cover transition-2'
                  />
                  <img
                    src='assets/images/thumbs/enroll-student-img4.png'
                    alt=''
                    className='w-48 h-48 rounded-circle object-fit-cover transition-2'
                  />
                  <img
                    src='assets/images/thumbs/enroll-student-img5.png'
                    alt=''
                    className='w-48 h-48 rounded-circle object-fit-cover transition-2'
                  />
                  <img
                    src='assets/images/thumbs/enroll-student-img6.png'
                    alt=''
                    className='w-48 h-48 rounded-circle object-fit-cover transition-2'
                  />
                </div>
                <div className=''>
                  <ul className='flex-align gap-4 mb-10'>
                    <li className='text-warning-600 text-2xl d-flex'>
                      <i className='ph-fill ph-star' />
                    </li>
                    <li className='text-warning-600 text-2xl d-flex'>
                      <i className='ph-fill ph-star' />
                    </li>
                    <li className='text-warning-600 text-2xl d-flex'>
                      <i className='ph-fill ph-star' />
                    </li>
                    <li className='text-warning-600 text-2xl d-flex'>
                      <i className='ph-fill ph-star' />
                    </li>
                    <li className='text-warning-600 text-2xl d-flex'>
                      <i className='ph-fill ph-star-half' />
                    </li>
                  </ul>
                  <span className='text-neutral-700 fw-medium'>
                    {" "}
                    2.5k+ rəy (5 üzərindən 4.95)
                  </span>
                </div>
              </div>
            </div>
            <div className='col-xl-5 col-lg-6'>
              <div className='p-24 bg-white rounded-12 box-shadow-md'>
                <div className='border border-neutral-30 rounded-8 bg-main-25 p-24'>
                  <form action='#' id='commentForm'>
                    <h4 className='mb-0'>Müraciət forması</h4>
                    <span className='d-block border border-neutral-30 my-24 border-dashed' />
                    <div className='mb-24'>
                      <label
                        htmlFor='name'
                        className='text-neutral-700 text-lg fw-medium mb-12'
                      >
                        Adınız{" "}
                      </label>
                      <input
                        type='text'
                        className='common-input rounded-pill border-transparent focus-border-main-600'
                        id='name'
                        placeholder='Adınızı daxil edin...'
                      />
                    </div>
                    <div className='mb-24'>
                      <label
                        htmlFor='email'
                        className='text-neutral-700 text-lg fw-medium mb-12'
                      >
                        Email{" "}
                      </label>
                      <input
                        type='email'
                        className='common-input rounded-pill border-transparent focus-border-main-600'
                        id='email'
                        placeholder='Email ünvanınızı daxil edin...'
                      />
                    </div>
                    <div className='mb-24'>
                      <label
                        htmlFor='phone'
                        className='text-neutral-700 text-lg fw-medium mb-12'
                      >
                        Telefon{" "}
                      </label>
                      <input
                        type='tel'
                        className='common-input rounded-pill border-transparent focus-border-main-600'
                        id='phone'
                        placeholder='Telefon nömrənizi daxil edin...'
                      />
                    </div>
                    <div className='mb-24'>
                      <label
                        htmlFor='desc'
                        className='text-neutral-700 text-lg fw-medium mb-12'
                      >
                        Mesaj
                      </label>
                      <textarea
                        id='desc'
                        className='common-input rounded-24 border-transparent focus-border-main-600 h-110'
                        placeholder='Mesajınızı yazın...'
                        defaultValue={""}
                      />
                    </div>
                    <div className='mb-0'>
                      <button
                        type='submit'
                        className='btn btn-main rounded-pill flex-center gap-8 mt-40'
                      >
                        Mesaj göndər
                        <i className='ph-bold ph-arrow-up-right d-flex text-lg' />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ContactInner;
