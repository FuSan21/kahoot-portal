create policy "Allow public read access to quiz images" on storage.objects for
select using (bucket_id = 'quiz_images');
create policy "Allow quiz owners to upload images" on storage.objects for
insert to authenticated with check (
        bucket_id = 'quiz_images'
        and exists (
            select 1
            from public.quiz_sets
            where id::text = (storage.foldername(storage.objects.name)) [1]
                and created_by = auth.uid()
        )
    );