"use client";
import {startTransition,useActionState,useState} from "react";
import {browsePlanner} from "@/app/search/actions";
import {EMPTY_SEARCH,type SearchState,type SearchKind} from "@/lib/search/types";
import {runAction} from "@/lib/shared/client-actions";
// One browse/search flow shared by record pickers. No cached choices across accounts.
export function useRecordChoices(kind:SearchKind){
 const [query,setQuery]=useState("");
 const [state,search,pending]=useActionState<SearchState,FormData>((previous,data)=>runAction(()=>browsePlanner(previous,data),{...EMPTY_SEARCH,error:"Items could not be loaded. Try refresh."}),EMPTY_SEARCH);
 function load(nextKind:SearchKind=kind){const data=new FormData();data.set("kind",nextKind);data.set("query",query);data.set("offset","0");startTransition(()=>search(data));}
 return {query,setQuery,state,search,pending,load,current:state.kind===kind&&state.query===query.trim()};
}
