import {conform, useForm} from '@conform-to/react'
import {getFieldsetConstraint, parse} from '@conform-to/zod'
import {type DataFunctionArgs, json} from '@remix-run/node'
import {Form, useActionData, useFormAction, useLocation, useNavigation,} from '@remix-run/react'
import {z} from 'zod'
import {ErrorList, Field} from '~/components/forms.tsx'
import {AnimatedOutlet} from '~/utils/misc.ts'
import {StatusButton} from '~/components/ui/status-button.tsx'
import * as React from 'react'
import {useRef} from 'react'
import {CSSTransition, SwitchTransition} from 'react-transition-group'
import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,} from '~/components/ui/tooltip.tsx'

import {Icon} from '../components/ui/icon.js'

const fbfsFormSchema = z.object({
    fish_bigger: z.string(),
    fish_smaller: z.string(),
})

export async function action({request}: DataFunctionArgs) {
    const formData = await request.formData()
    const submission = await parse(formData, {
        async: true,
        schema: fbfsFormSchema.superRefine(
            async ({fish_bigger, fish_smaller}, ctx) => {
                if (!fish_bigger) {
                    ctx.addIssue({
                        path: ['fish_bigger'],
                        code: 'custom',
                        message: '请输入“鱼越大”',
                    })
                }
                if (!fish_smaller) {
                    ctx.addIssue({
                        path: ['fish_smaller'],
                        code: 'custom',
                        message: '请输入“鱼越小”',
                    })
                }
                /**
                 * TODO: 对输入参数做以下业务检查：
                 *   - 两种参数不是“鱼越大”和“鱼越小”
                 *   - 两种参数不能相同
                 *   - 两种参数都包含“越”字且分别只包含一个“越”字
                 *   - 使用“越”字对两种参数分别split后，split的结果前后必须都大于等于1个字且小于等于10个字
                 */
            },
        ),
        acceptMultipleErrors: () => true,
    })
    if (submission.intent !== 'submit') {
        return json({data: null, status: 'idle', submission} as const)
    }
    if (!submission.value) {
        return json(
            {
                data: null,
                status: 'error',
                submission,
            } as const,
            {status: 400},
        )
    }
    const {fish_bigger, fish_smaller} = submission.value

    /**
     * Send HTTP request to backend
     */
    const res: String = await fetch(`${process.env.BACKEND_URL}/fbfs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            fish_bigger,
            fish_smaller,
        }),
    })
        .then(res => res.json())
        .then((res: any) => (res as { result: String }).result)

    return json({data: res, status: 'success', submission} as const, {
        status: 418,
        headers: {
            'Cache-Control': 'no-store',
        },
    })
}

export default function FBFSApp() {
    const actionData = useActionData<typeof action>()
    const navigation = useNavigation()
    const formAction = useFormAction()

    const location = useLocation()
    const nodeRef = useRef(null)

    const isSubmitting =
        navigation.state === 'submitting' &&
        navigation.formAction === formAction &&
        navigation.formMethod === 'POST'

    const [form, fields] = useForm({
        id: 'fbfs',
        constraint: getFieldsetConstraint(fbfsFormSchema),
        onValidate({formData}) {
            return parse(formData, {schema: fbfsFormSchema})
        },
        lastSubmission: actionData?.submission,
        defaultValue: {},
        shouldRevalidate: 'onBlur',
    })

    return (
        <div className="container m-auto mb-36 mt-16 max-w-3xl">
            <div className="mt-16 flex flex-col gap-12">
                <Form method="POST" {...form.props}>
                    <div className="grid grid-cols-6 gap-x-10">
                        <Field
                            className="col-span-3"
                            labelProps={{
                                htmlFor: fields.fish_bigger.id,
                                children: '鱼越大',
                            }}
                            inputProps={conform.input(fields.fish_bigger)}
                            errors={fields.fish_bigger.errors}
                        />
                        <Field
                            className="col-span-3"
                            labelProps={{
                                htmlFor: fields.fish_smaller.id,
                                children: '鱼越小',
                            }}
                            inputProps={conform.input(fields.fish_smaller)}
                            errors={fields.fish_smaller.errors}
                        />
                    </div>

                    <ErrorList errors={form.errors} id={form.errorId}/>

                    <div className="mt-8 flex justify-center">
                        <StatusButton
                            type="submit"
                            size="pill"
                            status={isSubmitting ? 'pending' : actionData?.status ?? 'idle'}
                        >
                            生成
                        </StatusButton>

                    </div>
                    <div>
                        <span
                            className="flex mt-8 justify-center text-sm text-secondary-foreground">生成一次最多需要20秒，请耐心等待</span>
                    </div>
                    <div
                        className="flex flex-wrap justify-center dark:bg-slate-200">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <a
                                        href="https://www.bilibili.com/video/BV17s4y1C72t"
                                        target="_blank"
                                        className="flex justify-center p-1 grayscale transition hover:grayscale-0 focus:grayscale-0" rel="noreferrer"
                                    >
                                        <Icon name="what" className="object-contain"/>
                                    </a>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <article>
                                        <p>鱼越大，鱼刺越多，鱼刺越多，鱼肉越少，鱼肉越少，鱼越小，所以鱼越大，鱼越小。</p>
                                        <p>以上逻辑链运用了&quot;滑坡谬误&quot;与&quot;前提不一致&quot;两种经典错误手法。</p>
                                        <p>完整的论述应当是，在部分种类的鱼中存在：</p>
                                        <ul>
                                            <li>（不同种类）鱼越大，刺越多</li>
                                            <li>（同一个体）刺越多，肉越少</li>
                                            <li>（同一种类）肉越少，鱼越小</li>
                                        </ul>
                                        <p>使用不同前提，进行连续地断言，推导出因果完全相反的结论，令人忍俊不禁</p>
                                        <p>如果将其演绎形式形式化：</p>
                                        <pre><code><span className="hljs-keyword">if</span> <span
                                            className="hljs-selector-tag">a</span> then <span
                                            className="hljs-selector-tag">b</span>, <span
                                            className="hljs-keyword">if</span> <span
                                            className="hljs-selector-tag">b</span> then c, <span
                                            className="hljs-keyword">if</span> c then d.

因此：<span className="hljs-keyword">if</span> <span className="hljs-selector-tag">a</span> then d
</code></pre>
                                        <p>这个结构属于逻辑学上的 modus ponens 肯定前件式，</p>
                                        <p>逻辑上肯定是没问题的，因为演绎过程都在肯定自己的前提条件 affirming
                                            antecedent，</p>
                                        <p>是有效演绎。逻辑学的核心原则在于，如果逻辑结构正确的情况下且所有前提为真，那么结论必定为真，</p>
                                        <p>这里问题就出现在前提上。如果一个演绎逻辑正确但前提如果是错误的话，就会出现“逻辑上正确但结论为假”的演绎。</p>
                                        <p>评估前提“错误之处”最为关键的一点就是语意不清的问题，某些有意或无意的替换概念。</p>

                                    </article>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {actionData?.data && (
                        <div className="mt-8 flex flex-col gap-4">
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
    )
}
