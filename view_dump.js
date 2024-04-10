const Activity = Java.use('android.app.Activity')
const Android_R_Id = Java.use('android.R$id')
const HashMap = Java.use('java.util.HashMap')
const View = Java.use('android.view.View')
const ViewGroup = Java.use('android.view.ViewGroup')
const Stack = Java.use('java.util.Stack')
const ActivityThread = Java.use('android.app.ActivityThread')
const ActivityManager = Java.use('android.app.ActivityManager')
const ActivityManager_RunningTaskInfo = Java.use('android.app.ActivityManager$RunningTaskInfo')

class HashMapBuilder {
    static build(key, value) {
        const map = HashMap.$new()
        map.put('key', key)
        map.put('value', value)
        return map
    }
}

function logViewHierarchyActivity(activity) {
    activity = Java.cast(activity, Activity)
    logViewHierarchy(activity.findViewById(Android_R_Id.content.value))
}

function resolveIdToName(resources, view) {
    if (resources === null) return '';

    try {
        return ' / ' + resources.getResourceEntryName(view.getId())
    } catch (_) {
        return ''
    }
}

function logViewHierarchy(root) {
    root = Java.cast(root, View)
    let resources = root.getResources()
    let stack = Stack.$new()
    stack.push(HashMapBuilder.build('', root))
    let output = []

    while (!stack.empty()) {
        let map = stack.pop()
        map = Java.cast(map, HashMap)
        let key = map.get('key')
        let view = map.get('value')
        view = Java.cast(view, View)
        let isLastOnLevel = stack.empty()
        if (!isLastOnLevel) {
            let i = stack.peek()
            i = Java.cast(i, HashMap)
            isLastOnLevel = key == i.get('key')
        }
        let graphics = '' + key + (isLastOnLevel ? '└── ' : '├── ')
        let className = view.getClass().getSimpleName()
        let line = graphics + className + ' id=' + view.getId() + resolveIdToName(resources, view)
        output.push(line)

        if (ViewGroup.class.isInstance(view)) {
            let viewGroup = Java.cast(view, ViewGroup)
            for (let i = 0; i < viewGroup.getChildCount(); i++) {
                stack.push(HashMapBuilder.build(key + (isLastOnLevel ? '    ' : '│   '), viewGroup.getChildAt(i)))
            }
        }
    }

    console.log(output.join('\n'))
}

function getFrontmostActivity(callback) {
    let am = ActivityThread.currentApplication().getSystemService('activity')
    am = Java.cast(am, ActivityManager)
    let taskInfo = am.getRunningTasks(1).get(0)
    taskInfo = Java.cast(taskInfo, ActivityManager_RunningTaskInfo)
    let activityName = taskInfo.topActivity.value.getClassName()
    let find = false
    Java.choose(activityName, {
        onMatch: (instance) => {
            if (!find) {
                callback(instance)
                find = true
            }
        },
        onComplete: () => {}
    })
}

Java.perform(() => {
    getFrontmostActivity(function(instance) {
        logViewHierarchyActivity(instance);
    })
})
