// Explicit v1 export contract: no credentials or automatically included future columns.
export const EXPORT_COLUMNS={
  "tasks": [
    "id",
    "title",
    "completed",
    "created_at",
    "updated_at",
    "due_date",
    "priority",
    "planning_revision",
    "space_id"
  ],
  "calendar_events": [
    "id",
    "title",
    "event_date",
    "created_at",
    "updated_at"
  ],
  "notes": [
    "id",
    "title",
    "body",
    "revision",
    "created_at",
    "updated_at"
  ],
  "spaces": [
    "id",
    "title",
    "revision",
    "created_at",
    "updated_at",
    "icon",
    "cover",
    "accent"
  ],
  "space_pages": [
    "id",
    "space_id",
    "title",
    "body",
    "revision",
    "created_at",
    "updated_at"
  ],
  "habits": [
    "id",
    "title",
    "kind",
    "target",
    "unit",
    "schedule",
    "weekdays",
    "weekly_goal",
    "space_id",
    "start_date",
    "paused",
    "revision",
    "created_at"
  ],
  "habit_checkins": [
    "habit_id",
    "log_date",
    "amount",
    "target",
    "unit",
    "kind",
    "revision"
  ],
  "projects": [
    "id",
    "title",
    "description",
    "status",
    "space_id",
    "revision",
    "created_at"
  ],
  "project_items": [
    "project_id",
    "kind",
    "target_id",
    "task_id",
    "note_id",
    "page_id",
    "active",
    "revision"
  ],
  "inbox_captures": [
    "id",
    "kind",
    "title",
    "body",
    "space_id",
    "task_id",
    "note_id",
    "page_id",
    "reviewed",
    "revision",
    "created_at"
  ],
  "space_creation_receipts": [
    "space_id",
    "template_key",
    "initial_title",
    "first_page_id",
    "created_at"
  ],
  "planner_preferences": [
    "theme",
    "updated_at",
    "background_pattern",
    "background_intensity",
    "background_revision",
    "nav_position",
    "nav_revision",
    "font_preset",
    "text_size",
    "app_zoom",
    "reduce_motion",
    "strong_focus",
    "simple_background",
    "text_revision",
    "zoom_revision",
    "accessibility_revision",
    "week_start",
    "date_format",
    "planning_revision"
  ],
  "dashboard_layouts": [
    "layout",
    "revision",
    "updated_at"
  ],
  "knowledge_links": [
    "source_kind",
    "source_id",
    "target_kind",
    "target_id"
  ]
} as const;
export const EXPORT_MAX_BYTES=20*1024*1024,EXPORT_MAX_RECORDS=50000;
// Keep v1 readable; v2 adds saved repeat settings and occurrence identities.
export const EXPORT_COLUMNS_V2={...EXPORT_COLUMNS,tasks:[...EXPORT_COLUMNS.tasks,"repeat_frequency","repeat_anchor_day","repeat_next_id","repeat_parent_id"]} as const;
export const EXPORT_COLUMNS_V3={...EXPORT_COLUMNS_V2,tasks:[...EXPORT_COLUMNS_V2.tasks,"repeat_rule","repeat_anchor_date","repeat_index","repeat_finished"]} as const;
export const EXPORT_COLUMNS_V4={...EXPORT_COLUMNS_V3,tasks:[...EXPORT_COLUMNS_V3.tasks,"due_time","due_timezone"]} as const;
export const EXPORT_COLUMNS_V5={...EXPORT_COLUMNS_V4,planner_preferences:[...EXPORT_COLUMNS_V4.planner_preferences,"show_task_timezones"]} as const;
export const EXPORT_COLUMNS_V6={...EXPORT_COLUMNS_V5,tasks:[...EXPORT_COLUMNS_V5.tasks,"repeat_series_id","repeat_scheduled_date"],task_repeat_changes:["series_id","occurrence_index","kind","source_id","target_id","scheduled_date","scheduled_time","scheduled_timezone","created_at"],task_reschedule_receipts:["id","payload","target_id","created_at"]} as const;
export type ExportCollection=keyof typeof EXPORT_COLUMNS_V6;
export type PlannerExport={format:"life-planner-export";format_version:1|2|3|4|5|6;exported_at:string;total_records:number;counts:Record<ExportCollection,number>;data:Record<ExportCollection,Record<string,unknown>[]>};
export function validExport(value:unknown):value is PlannerExport{
 if(!value||typeof value!=="object")return false;const d=value as PlannerExport;
 if(d.format!=="life-planner-export"||![1,2,3,4,5,6].includes(d.format_version)||typeof d.exported_at!=="string"||!/^\d{4}-\d{2}-\d{2}T.*Z$/.test(d.exported_at)||!Number.isFinite(Date.parse(d.exported_at))||!Number.isSafeInteger(d.total_records)||d.total_records<0||d.total_records>EXPORT_MAX_RECORDS||!d.counts||!d.data)return false;
 const contract:Record<string,readonly string[]>=d.format_version===6?EXPORT_COLUMNS_V6:d.format_version===5?EXPORT_COLUMNS_V5:d.format_version===4?EXPORT_COLUMNS_V4:d.format_version===3?EXPORT_COLUMNS_V3:d.format_version===2?EXPORT_COLUMNS_V2:EXPORT_COLUMNS;
 const keys=Object.keys(contract) as ExportCollection[];
 if(Object.keys(d).sort().join()!==["format","format_version","exported_at","total_records","counts","data"].sort().join()||Object.keys(d.counts).sort().join()!==[...keys].sort().join()||Object.keys(d.data).sort().join()!==[...keys].sort().join())return false;
 let total=0;
 for(const key of keys){const rows=d.data[key],count=d.counts[key];if(!Number.isSafeInteger(count)||count<0||!Array.isArray(rows)||rows.length!==count||count>EXPORT_MAX_RECORDS)return false;
 if((key==="planner_preferences"||key==="dashboard_layouts")&&count>1)return false;
 const columns:readonly string[]=contract[key];if(rows.some(row=>!row||typeof row!=="object"||Array.isArray(row)||Object.keys(row).length!==columns.length||Object.keys(row).some(k=>!columns.includes(k))))return false;total+=count;
 }
 return total===d.total_records;
}
export function exportFilename(value:PlannerExport){return "life-planner-export-"+value.exported_at.slice(0,10)+".json";}
