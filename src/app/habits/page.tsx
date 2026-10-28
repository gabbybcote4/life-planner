import {requireAccount} from "@/lib/auth/account";
import {PlannerPage,PlannerHeading} from "@/app/components/planner-page";
import {HabitsView} from "./habits-view";
async function Content(){const {userId,email}=await requireAccount();return <><PlannerHeading eyebrow="Small steps, your rhythm" title="A little every day." description="Pick · check in · keep going" email={email}/><HabitsView key={userId}/></>;}
export default function HabitsPage(){return <PlannerPage active="habits" loading="Opening your habits…"><Content/></PlannerPage>;}