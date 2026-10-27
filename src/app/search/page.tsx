import {requireAccount} from "@/lib/auth/account";
import {isSupabaseConfigured} from "@/lib/supabase/config";
import {PlannerPage,PlannerHeading,SetupNotice} from "@/app/components/planner-page";
import {SearchForm} from "./search-form";
async function SearchContent() {
 if(!isSupabaseConfigured()) return <SetupNotice/>;
 const {userId,email}=await requireAccount();
 return <><PlannerHeading eyebrow="Find your way back" title="Everything, within reach." description="Find tasks, calendar events, notes, spaces, and pages from one place." email={email}/><SearchForm key={userId}/></>;
}
export default function SearchPage(){return <PlannerPage active="search" loading="Opening search..."><SearchContent/></PlannerPage>;}
