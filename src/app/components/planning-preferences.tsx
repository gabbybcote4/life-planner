"use client";
import {createContext,useContext,type ReactNode} from "react";
import {DEFAULT_PLANNING,shortDate,type PlanningPreferences} from "@/lib/calendar/preferences";
const Context=createContext<PlanningPreferences>(DEFAULT_PLANNING);
export function PlanningProvider({value,children}:{value:PlanningPreferences;children:ReactNode}){return <Context.Provider value={value}>{children}</Context.Provider>;}
export function usePlanning(){return useContext(Context);}
export function DateLabel({date}:{date:string}){const {date_format}=usePlanning();return <>{shortDate(date,date_format)}</>;}
