-- Dados fictícios para demonstração. Mantém registros existentes e evita duplicatas.
with dates as (
  select (now() at time zone 'America/Argentina/Buenos_Aires')::date as today
), examples as (
  select jsonb_build_array(
    jsonb_build_object('id','demo-agenda-aula','area','Semana','title','Aula de Clínica Médica','detail','','date',to_char(today,'YYYY-MM-DD'),'startTime','08:00','weekly',true),
    jsonb_build_object('id','demo-agenda-estudo','area','Semana','title','Estudar para a prova','detail','','date',to_char(today + 2,'YYYY-MM-DD'),'startTime','17:30'),
    jsonb_build_object('id','demo-agenda-consulta','area','Semana','title','Consulta médica','detail','','date',to_char(today + 4,'YYYY-MM-DD'),'startTime','10:00'),
    jsonb_build_object('id','demo-subject-anatomia','area','Estudos','kind','Matéria','title','Anatomia','detail','','weekday',1,'startTime','09:00'),
    jsonb_build_object('id','demo-subject-farmacologia','area','Estudos','kind','Matéria','title','Farmacologia','detail','','weekday',4,'startTime','14:00'),
    jsonb_build_object('id','demo-content-cardiovascular','area','Estudos','kind','Tema','title','Sistema cardiovascular','detail','Coração e circulação','parent','demo-subject-anatomia'),
    jsonb_build_object('id','demo-content-antibioticos','area','Estudos','kind','Tema','title','Antibióticos','detail','Classes e mecanismos de ação','parent','demo-subject-farmacologia'),
    jsonb_build_object('id','demo-exam-anatomia','area','Estudos','kind','Prova','title','Prova de Anatomia','detail','','date',to_char(today + 7,'YYYY-MM-DD'),'parent','demo-subject-anatomia','contentId','demo-content-cardiovascular'),
    jsonb_build_object('id','demo-review-farmacologia','area','Estudos','kind','Revisão','title','Revisar antibióticos','detail','','date',to_char(today + 3,'YYYY-MM-DD'),'parent','demo-subject-farmacologia','contentId','demo-content-antibioticos','done',false),
    jsonb_build_object('id','demo-account-carteira','area','Finanças','kind','Conta','title','Carteira','detail','','amount',80000,'color','#112c0f'),
    jsonb_build_object('id','demo-account-banco','area','Finanças','kind','Conta','title','Banco','detail','','amount',220000,'color','#13b195'),
    jsonb_build_object('id','demo-expense-mercado','area','Finanças','kind','Gasto','title','Mercado','detail','','category','Alimentação','parent','demo-account-banco','date',to_char(today,'YYYY-MM-DD'),'amount',24500),
    jsonb_build_object('id','demo-expense-transporte','area','Finanças','kind','Gasto','title','Transporte','detail','','category','Transporte','parent','demo-account-carteira','date',to_char(today - 2,'YYYY-MM-DD'),'amount',6200),
    jsonb_build_object('id','demo-fixed-internet','area','Finanças','kind','Conta fixa','title','Internet','detail','','category','Casa','parent','demo-account-banco','date',to_char(date_trunc('month',today)::date,'YYYY-MM-DD'),'amount',18500),
    jsonb_build_object('id','demo-installment-tablet','area','Finanças','kind','Parcela','title','Tablet','detail','','category','Estudos','parent','demo-account-banco','date',to_char(date_trunc('month',today)::date,'YYYY-MM-DD'),'amount',32000,'installments',6),
    jsonb_build_object('id','demo-limit-month','area','Finanças','kind','Limite','title','Limite do mês','detail','','date',to_char(today,'YYYY-MM-DD'),'amount',150000)
  ) as entries from dates
), missing as (
  select jsonb_agg(example.value) as entries
  from public.organiza_workspace workspace
  cross join examples
  cross join lateral jsonb_array_elements(examples.entries) example(value)
  where workspace.id = 1
    and not exists (
      select 1 from jsonb_array_elements(workspace.entries) existing(value)
      where existing.value->>'id' = example.value->>'id'
    )
)
update public.organiza_workspace workspace
set entries = workspace.entries || missing.entries,
    version = workspace.version + 1
from missing
where workspace.id = 1 and missing.entries is not null
returning workspace.version, jsonb_array_length(workspace.entries) as total_entries;
