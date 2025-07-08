<script setup lang="ts">
    import { InputText, Button } from 'primevue';
    useHead({
        title: 'DBL - Login',
    })
</script>

<template>
    <div class="bg">
        <main>
            <img src="/logo.svg" alt="logo" />
            <div class="card">
                <h1 class="text-2xl">Log in</h1>
                <InputText placeholder="Username" class="w-full" />
                <InputText type="password" placeholder="Password" class="w-full" />
                <Button class="ml-auto">Log in</Button>
            </div>
        </main>
    </div>
</template>

<style scoped>
.bg {
    background-image: url('/login-background.jpg');
    background-size: cover;
    background-position: center;
    height: 100vh;
    width: 100vw;
}
main {
    width: 100%;
    position: relative;
    top: 50%;
    transform: translateY(-50%);
    background-color: rgba(0, 0, 0, .7);
    backdrop-filter: blur(10px) saturate(150%);
    padding: 20px;
}
.card {
    display: flex;
    flex-direction: column;
    gap: 10px;
}
img {
    width: 400px;
}

@media (width >= 48rem) {
    main {
        margin-left: 25px;
        border-radius: 10px;
        width: 400px;
    }
}
</style>