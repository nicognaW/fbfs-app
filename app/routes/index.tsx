import {conform, useForm} from "@conform-to/react";
import {getFieldsetConstraint, parse} from "@conform-to/zod";
import {type DataFunctionArgs, json} from "@remix-run/node";
import {Form, useActionData, useFormAction, useLocation, useNavigation} from "@remix-run/react";
import {z} from "zod";
import {ErrorList, Field} from "~/components/forms.tsx";
import {AnimatedOutlet} from "~/utils/misc.ts";
import {StatusButton} from "~/components/ui/status-button.tsx";
import {useRef} from "react";
import {CSSTransition, SwitchTransition} from "react-transition-group";


const fbfsFormSchema = z.object({
  fish_bigger: z.string(),
  fish_smaller: z.string()
});


export async function action({request}: DataFunctionArgs) {
  const formData = await request.formData();
  const submission = await parse(formData, {
    async: true,
    schema: fbfsFormSchema.superRefine(
      async ({fish_bigger, fish_smaller}, ctx) => {
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
    return json({data: null, status: "idle", submission} as const);
  }
  if (!submission.value) {
    return json(
      {
        data: null,
        status: "error",
        submission
      } as const,
      {status: 400}
    );
  }
  const {fish_bigger, fish_smaller} = submission.value;

  /**
   * Send HTTP request to backend
   */
  const res: String = await fetch(
    `https://api.ihint.me/fbfs?fish_bigger=${fish_bigger}&fish_smaller=${fish_smaller}`
  ).then((res) => res.text());

  return json({data: res, status: "success", submission} as const, {
    status: 418,
    headers: {
      "Cache-Control": "no-store"
    }
  })
}

export default function FBFSApp() {
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
    onValidate({formData}) {
      return parse(formData, {schema: fbfsFormSchema});
    },
    lastSubmission: actionData?.submission,
    defaultValue: {},
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
                htmlFor: fields.fish_bigger.id,
                children: "鱼越大"
              }}
              inputProps={conform.input(fields.fish_bigger)}
              errors={fields.fish_bigger.errors}
            />
            <Field
              className="col-span-3"
              labelProps={{htmlFor: fields.fish_smaller.id, children: "鱼越小"}}
              inputProps={conform.input(fields.fish_smaller)}
              errors={fields.fish_smaller.errors}
            />
          </div>

          <ErrorList errors={form.errors} id={form.errorId}/>

          <div className="mt-8 flex justify-center">
            <StatusButton
              type="submit"
              size="pill"
              status={isSubmitting ? "pending" : actionData?.status ?? "idle"}
            >
              生成
            </StatusButton>
          </div>
          {/*if `actionData?.data` is valid, display the data*/}
          {actionData?.data && (
            <div className="flex flex-col gap-4">
              <div className="text-2xl font-bold">{actionData?.data}</div>
            </div>
          )}

        </Form>
      </div>
      <SwitchTransition>
        <CSSTransition key={location.pathname} timeout={150} nodeRef={nodeRef}>
          <div ref={nodeRef}>
            <AnimatedOutlet/>
          </div>
        </CSSTransition>
      </SwitchTransition>
    </div>
  );
}
