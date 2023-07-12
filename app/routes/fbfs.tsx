import { conform, useForm } from "@conform-to/react";
import { getFieldsetConstraint, parse } from "@conform-to/zod";
import { type DataFunctionArgs, json, redirect } from "@remix-run/node";
import { Form, useActionData, useFormAction, useLoaderData, useLocation, useNavigation } from "@remix-run/react";
import { z } from "zod";
import { getPasswordHash } from "~/utils/auth.server.ts";
import { prisma } from "~/utils/db.server.ts";
import { ErrorList, Field } from "~/components/forms.tsx";
import { AnimatedOutlet } from "~/utils/misc.ts";
import { StatusButton } from "~/components/ui/status-button.tsx";
import { useRef } from "react";
import { CSSTransition, SwitchTransition } from "react-transition-group";


const fbfsFormSchema = z.object({
  fish_bigger: z.string(),
  fish_smaller: z.string()
});


export async function loader({ request }: DataFunctionArgs) {
  return json({});
}

export async function action({ request }: DataFunctionArgs) {
  const formData = await request.formData();
  const submission = await parse(formData, {
    async: true,
    schema: fbfsFormSchema.superRefine(
      async ({ fish_bigger, fish_smaller }, ctx) => {
        if (!fish_bigger) {
          ctx.addIssue({
            path: ["fish_bigger"],
            code: "custom",
            message: "请输入“鱼越大”"
          });
        }
        if (!fish_smaller) {
          ctx.addIssue({
            path: ["fish_smaller"],
            code: "custom",
            message: "请输入“鱼越小”"
          });
        }
        /**
         * TODO: 对输入参数做以下业务检查：
         *   - 两种参数不是“鱼越大”和“鱼越小”
         *   - 两种参数不能相同
         *   - 两种参数都包含“越”字且分别只包含一个“越”字
         *   - 使用“越”字对两种参数分别split后，split的结果前后必须都大于等于1个字且小于等于10个字
         */
      }
    ),
    acceptMultipleErrors: () => true
  });
  if (submission.intent !== "submit") {
    return json({ status: "idle", submission } as const);
  }
  if (!submission.value) {
    return json(
      {
        status: "error",
        submission
      } as const,
      { status: 400 }
    );
  }
  const { fish_bigger, fish_smaller } = submission.value;
  
  const res = "TODO: fill in the result";
  
  json(
    { not: "coffee" },
    {
      status: 418,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

export default function FBFSApp() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const formAction = useFormAction();
  
  const location = useLocation();
  const nodeRef = useRef(null);
  
  const isSubmitting =
    navigation.state === "submitting" &&
    navigation.formAction === formAction &&
    navigation.formMethod === "POST";
  
  const [form, fields] = useForm({
    id: "fbfs",
    constraint: getFieldsetConstraint(fbfsFormSchema),
    lastSubmission: actionData?.submission,
    onValidate({ formData }) {
      return parse(formData, { schema: fbfsFormSchema });
    },
    defaultValue: {
    },
    shouldRevalidate: "onBlur"
  });
  
  return (
    <div className="container m-auto mb-36 mt-16 max-w-3xl">
      <div className="mt-16 flex flex-col gap-12">
        <Form method="POST" {...form.props}>
          <div className="grid grid-cols-6 gap-x-10">
            <Field
              className="col-span-3"
              labelProps={{
                htmlFor: fields.username.id,
                children: "鱼越大"
              }}
              inputProps={conform.input(fields.username)}
              errors={fields.username.errors}
            />
            <Field
              className="col-span-3"
              labelProps={{ htmlFor: fields.name.id, children: "鱼越小" }}
              inputProps={conform.input(fields.name)}
              errors={fields.name.errors}
            />
          </div>
          
          <ErrorList errors={form.errors} id={form.errorId} />
          
          <div className="mt-8 flex justify-center">
            <StatusButton
              type="submit"
              size="pill"
              status={isSubmitting ? "pending" : actionData?.status ?? "idle"}
            >
              生成
            </StatusButton>
          </div>
        </Form>
      </div>
      <SwitchTransition>
        <CSSTransition key={location.pathname} timeout={150} nodeRef={nodeRef}>
          <div ref={nodeRef}>
            <AnimatedOutlet />
          </div>
        </CSSTransition>
      </SwitchTransition>
    </div>
  );
}
