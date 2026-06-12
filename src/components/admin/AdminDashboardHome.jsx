import OverviewChart from "@/components/admin/charts/admin/OverviewChart";
import ReportsDonutChart from "@/components/admin/charts/admin/ReportsDonutChart";
import ChildLearningChart from "@/components/admin/charts/child/ChildLearningChart";
import ParentProgressChart from "@/components/admin/charts/parent/ParentProgressChart";

const stats = [
  ["Total Courses", "2000+", "dashbord-item1.png", "bg-main-600"],
  ["Enrolled Courses", "900+", "dashbord-item2.png", "bg-success-600"],
  ["Active Courses", "100+", "dashbord-item3.png", "bg-warning-600"],
  ["Completed Courses", "1000+", "dashbord-item4.png", "bg-warning-600"],
  ["Total Students", "88,000+", "dashbord-item5.png", "bg-main-600"],
  ["Total Earnings", "$956,542.00", "dashbord-item6.png", "bg-success-600"],
];

const popularInstructors = [
  ["Jerome Bell", "Web Design", "4.8(55K+ Students)"],
  ["Courtney Henry", "Python", "4.8(55K+ Students)"],
  ["Wade Warren", "Marketing", "4.8(55K+ Students)"],
  ["Esther Howard", "UX Design", "4.8(55K+ Students)"],
];

const recentCourses = [
  ["dashboard-img1.png", "Vuejs Courses", "12h 30m", "24 Lesson", "280"],
  ["dashboard-img2.png", "Swift Courses", "10h 20m", "18 Lesson", "180"],
  ["dashboard-img3.png", "Objective C Courses", "14h 10m", "26 Lesson", "320"],
  ["dashboard-img4.png", "NodeJS Courses", "08h 45m", "16 Lesson", "150"],
  ["dashboard-img5.png", "CSS3 Courses", "06h 50m", "12 Lesson", "210"],
];

const StatCard = ({ stat }) => (
  <div className='col-xl-4 col-sm-6'>
    <div className='px-20 py-20 bg-white rounded-10'>
      <div className='d-flex gap-16 justify-content-between mb-12'>
        <div>
          <span className='fw-normal text-14 text-neutral-400 mb-4'>{stat[0]}</span>
          <h6 className='text-18 fw-semibold text-neutral-500 mb-0'>{stat[1]}</h6>
        </div>
        <span className={`w-44 h-44 ${stat[3]} rounded-circle justify-content-center align-items-center d-flex`}>
          <img src={`/assets/images/icons/${stat[2]}`} alt='' />
        </span>
      </div>
      <a href='#' className='text-12 fw-medium text-main-600 text-decoration-underline transition-03'>
        View all
      </a>
    </div>
  </div>
);

const AdminDashboardHome = () => (
  <div className='px-24 py-24'>
    <h4 className='fw-semibold text-neutral-500 text-20'>Dashboard</h4>
    <div className='row gy-4'>
      {stats.map((stat) => (
        <StatCard key={stat[0]} stat={stat} />
      ))}

      <div className='col-xl-8'>
        <div className='bg-white px-20 py-20 rounded-10 z-n1'>
          <div className='d-flex align-items-center justify-content-between gap-24'>
            <span className='text-16 fw-medium text-neutral-400'>Overview Information</span>
            <select className='form-select text-12 w-auto pe-26 border-neutral-40 border bg-main-25 px-16 py-8 fw-normal'>
              <option>Last 2 years</option>
              <option>Last 3 years</option>
              <option>Last 4 years</option>
            </select>
          </div>
          <span className='mt-20 mb-20 border-bottom-solid d-inline-block w-100'></span>
          <OverviewChart />
          <div className='d-flex justify-content-center text-center'>
            <ul className='d-flex align-items-center gap-24'>
              <li className='text-14 fw-normal d-flex align-items-center gap-8 text-neutral-500'>
                <span className='w-6 h-6 bg-main-600 rounded-circle z-1 flex-shrink-0'></span>
                Total Students
              </li>
              <li className='text-14 fw-normal d-flex align-items-center gap-8 text-neutral-500'>
                <span className='w-6 h-6 bg-warning-600 rounded-circle z-1 flex-shrink-0'></span>
                Total Courses
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className='col-xl-4'>
        <div className='px-20 py-20 bg-white rounded-10 z-n1'>
          <div className='d-flex align-items-center justify-content-between gap-24'>
            <span className='text-14 fw-normal text-neutral-500'>Reports</span>
            <select className='form-select w-auto pe-26 border-neutral-40 border text-12 bg-main-25 px-16 py-8'>
              <option>Weekly</option>
              <option>Monthly</option>
              <option>Yearly</option>
            </select>
          </div>
          <span className='mt-20 mb-20 border-bottom-solid d-inline-block w-100'></span>
          <ReportsDonutChart />
        </div>
      </div>

      <div className='col-xl-6'>
        <div className='px-24 py-24 bg-white rounded-10'>
          <div className='d-flex align-items-center justify-content-between mb-24'>
            <h6 className='mb-0 fw-medium text-16 text-neutral-500'>Popular Instructor</h6>
            <a href='#' className='text-12 fw-medium text-main-600 hover-underline transition-03'>
              View all
            </a>
          </div>
          <div className='table-responsive'>
            <table className='table mb-0'>
              <thead>
                <tr>
                  <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Instructor</th>
                  <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Course</th>
                  <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Students</th>
                </tr>
              </thead>
              <tbody>
                {popularInstructors.map((row) => (
                  <tr key={row[0]}>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{row[0]}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{row[1]}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className='col-xl-6'>
        <div className='px-24 py-24 bg-white rounded-10'>
          <div className='d-flex align-items-center justify-content-between mb-24'>
            <h6 className='mb-0 fw-medium text-16 text-neutral-500'>Recent Course</h6>
            <a href='#' className='text-12 fw-medium text-main-600 hover-underline transition-03'>
              View all
            </a>
          </div>
          <div className='table-responsive'>
            <table className='table mb-0'>
              <thead>
                <tr>
                  <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Course Title | Hours</th>
                  <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Total Lesson</th>
                  <th className='text-12 fw-medium text-neutral-500 py-16 px-20'>Students</th>
                </tr>
              </thead>
              <tbody>
                {recentCourses.map((row) => (
                  <tr key={row[1]}>
                    <td className='py-16 px-20'>
                      <div className='d-flex align-items-center gap-12'>
                        <img src={`/assets/images/thumbs/${row[0]}`} alt='' className='w-48 h-32 rounded-4' />
                        <div>
                          <h6 className='fw-medium text-14 mb-0 text-neutral-500'>{row[1]}</h6>
                          <span className='text-12 text-neutral-400'>{row[2]}</span>
                        </div>
                      </div>
                    </td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{row[3]}</td>
                    <td className='py-16 px-20 text-14 text-neutral-500'>{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className='col-xl-6'>
        <ParentProgressChart />
      </div>
      <div className='col-xl-6'>
        <ChildLearningChart />
      </div>
    </div>
  </div>
);

export default AdminDashboardHome;
