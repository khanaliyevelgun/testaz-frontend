import Link from "next/link";
import StaticText from "@/components/StaticText";


export default function NotFound() {
  return (
    <section className='not_found'>
      <div className='container'>
        <div className='row'>
          <div className='col-12 text-center'>
            <h1 className='display-1'><StaticText text={"404 Error"} /></h1>
            <h2><StaticText text={"Page Not Found"} /></h2>
            <p>
              <StaticText text={"We are sorry, the page you are looking for could not be found."} />
            </p>

            <Link href='/' className='btn btn-main'>
              <StaticText text={"Back to Home"} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
