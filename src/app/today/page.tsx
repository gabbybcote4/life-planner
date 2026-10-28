import {requireAccount} from "@/lib/auth/account";
import {PlannerPage,PlannerHeading} from "@/app/components/planner-page";
import {TodayView} from "./today-view";
async function Content(){const {userId,email}=await requireAccount();return <><PlannerHeading eyebrow="Your life, together" title="Today, a little clearer." description="Tasks · habits · calendar" email={email}/><TodayView key={userId}/></>;}
export default function TodayPage(){return <PlannerPage active="today" loading="Opening your connected day…"><Content/></PlannerPage>;}